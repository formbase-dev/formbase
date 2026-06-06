CREATE TABLE `webhook_delivery_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`form_data_id` text,
	`webhook_url` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`status_code` integer,
	`response_body` text,
	`error_message` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_retry_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`form_data_id`) REFERENCES `form_datas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `webhook_log_form_idx` ON `webhook_delivery_logs` (`form_id`);--> statement-breakpoint
CREATE INDEX `webhook_log_status_idx` ON `webhook_delivery_logs` (`status`);--> statement-breakpoint
CREATE INDEX `webhook_log_next_retry_idx` ON `webhook_delivery_logs` (`next_retry_at`);--> statement-breakpoint
ALTER TABLE `forms` ADD `enable_webhook` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `forms` ADD `webhook_url` text;--> statement-breakpoint
ALTER TABLE `forms` ADD `webhook_secret` text;