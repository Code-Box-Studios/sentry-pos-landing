import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cms"."legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_name" varchar,
  	"contact_email" varchar,
  	"terms_published" boolean DEFAULT false,
  	"terms_effective_date" timestamp(3) with time zone,
  	"terms_body" varchar,
  	"privacy_published" boolean DEFAULT false,
  	"privacy_effective_date" timestamp(3) with time zone,
  	"privacy_body" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."media" ADD COLUMN "prefix" varchar DEFAULT '';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."legal_pages" CASCADE;
  ALTER TABLE "cms"."media" DROP COLUMN "prefix";`)
}
