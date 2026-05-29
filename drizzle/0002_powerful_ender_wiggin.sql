CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"start_balance" numeric(10, 2) NOT NULL,
	"end_balance" numeric(10, 2),
	"actual_cash" numeric(10, 2),
	"notes" varchar(255),
	"status" varchar(20) DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer,
	"customer_name" varchar(100) NOT NULL,
	"customer_phone" varchar(20),
	"scheduled_time" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"status" varchar(20) DEFAULT 'confirmed',
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "queues" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"customer_phone" varchar(20),
	"group_size" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'waiting',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;