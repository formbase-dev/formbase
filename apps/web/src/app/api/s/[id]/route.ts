import { userAgent } from 'next/server';

import { type RouterOutputs } from '@formbase/api';
import { env } from '@formbase/env';

import { sendMail } from '~/lib/email/mailer';
import { renderNewSubmissionEmail } from '~/lib/email/templates/new-submission';
import { checkForSpam, stripHoneypotField } from '~/lib/spam-detection';
import { api } from '~/lib/trpc/server';
import { assignFileOrImage, uploadFileFromBlob } from '~/lib/upload-file';

type FormDataResult =
  | {
      data: Record<string, Blob | string | undefined>;
      source: 'formData';
      rawFormData: FormData;
    }
  | {
      data: Record<string, Blob | string | undefined>;
      source: 'json';
    };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function getFormData(request: Request): Promise<FormDataResult> {
  const contentType = request.headers.get('content-type') ?? '';

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    try {
      const rawFormData = await request.formData();
      const data: Record<string, Blob | string | undefined> = {};
      rawFormData.forEach((value, key) => {
        data[key] = value;
      });
      return { data, source: 'formData', rawFormData };
    } catch {
      throw new Error('Invalid form data');
    }
  }

  try {
    const jsonData: unknown = await request.json();
    if (typeof jsonData !== 'object' || jsonData === null) {
      throw new Error('Invalid form data');
    }
    const jsonObject = jsonData as Record<string, unknown>;
    const data: Record<string, Blob | string | undefined> = {};
    Object.keys(jsonObject).forEach((key) => {
      data[key] = jsonObject[key] as Blob | string | undefined;
    });
    return { data, source: 'json' };
  } catch {
    throw new Error('Invalid form data');
  }
}

async function processFileUploads(
  formData: Record<string, Blob | string | undefined>,
  formDataFromRequest: FormData,
) {
  const fileKeys = Object.keys(formData).filter(
    (key) => formData[key] instanceof Blob,
  );

  for (const key of fileKeys) {
    const file = formDataFromRequest.get(key) as File;
    const fileUrl = await uploadFileFromBlob({ file });
    assignFileOrImage({ formData, key, fileUrl });
  }
}

async function handleEmailNotifications(
  form: NonNullable<RouterOutputs['form']['getFormById']>,
  submissionData: Record<string, unknown>,
) {
  if (form.enableEmailNotifications) {
    const user = await api.user.getUserById({ userId: form.userId });
    if (!user) throw new Error('User not found');

    await sendMail({
      to: form.defaultSubmissionEmail ?? user.email,
      subject: `New Submission for "${form.title}"`,
      body: renderNewSubmissionEmail({
        formTitle: form.title,
        submissionData,
      }),
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const formId = id;
    const form = await api.form.getFormById({ formId });
    if (!form) {
      return new Response('Form not found', {
        status: 404,
        headers: {
          ...CORS_HEADERS,
        },
      });
    }

    const formDataResult = await getFormData(request);
    const { data: formData } = formDataResult;

    if (formDataResult.source === 'formData') {
      await processFileUploads(formData, formDataResult.rawFormData);
    }

    const honeypotField = form.honeypotField;
    const spamResult = checkForSpam(formData, honeypotField);
    const cleanedFormData = stripHoneypotField(formData, honeypotField);

    const formDataKeys = Object.keys(cleanedFormData);
    const formKeys = form.keys;
    const updatedKeys = [...new Set([...formKeys, ...formDataKeys])];

    await api.formData.setFormData({
      data: cleanedFormData,
      formId,
      keys: updatedKeys,
      isSpam: spamResult.isSpam,
      spamReason: spamResult.spamReason,
    });

    if (!spamResult.isSpam) {
      void handleEmailNotifications(form, cleanedFormData);
    }
    const { browser } = userAgent(request);

    if (!browser.name) {
      return new Response(
        JSON.stringify({
          formId,
          message: 'Submission successful',
          data: formData,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        },
      );
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: `${env.NEXT_PUBLIC_APP_URL}/s/${formId}`,
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('There was an issue processing your form', {
      status: 500,
      headers: {
        ...CORS_HEADERS,
      },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function OPTIONS() {
  return new Response('', {
    status: 200,
    headers: CORS_HEADERS,
  });
}
