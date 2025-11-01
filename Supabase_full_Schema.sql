-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;
-- public.clients definition

-- Drop table

-- DROP TABLE public.clients;

CREATE TABLE public.clients (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	slug text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	logo_url text NULL,
	video_provider text DEFAULT 'youtube'::text NULL,
	video_url text NULL,
	booking_url text NULL,
	theme jsonb DEFAULT '{}'::jsonb NULL,
	"content" jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT clients_pkey PRIMARY KEY (id),
	CONSTRAINT clients_slug_key UNIQUE (slug),
	CONSTRAINT clients_video_provider_check CHECK ((video_provider = ANY (ARRAY['youtube'::text, 'vimeo'::text, 'self'::text, 'other'::text])))
);
CREATE INDEX idx_clients_slug ON public.clients USING btree (slug);

-- Table Triggers

create trigger trg_set_updated_at before
update
    on
    public.clients for each row execute function set_updated_at();


-- public.collages definition

-- Drop table

-- DROP TABLE public.collages;

CREATE TABLE public.collages (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	before_image_url text NOT NULL,
	after_image_url text NOT NULL,
	collage_url text NOT NULL,
	ai_prompt text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT collages_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_collages_created_at ON public.collages USING btree (created_at DESC);


-- public.media_files definition

-- Drop table

-- DROP TABLE public.media_files;

CREATE TABLE public.media_files (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id text NOT NULL,
	patient_id text NOT NULL,
	patient_photo_id text NOT NULL,
	category text NOT NULL,
	media_type text NOT NULL,
	file_type text NOT NULL,
	original_filename text NOT NULL,
	storage_path text NOT NULL,
	storage_url text NOT NULL,
	file_size int8 DEFAULT 0 NOT NULL,
	upload_timestamp timestamptz DEFAULT now() NOT NULL,
	quality_score int DEFAULT 0 NULL,
	brightness_level int DEFAULT 0 NULL,
	contrast_score int DEFAULT 0 NULL,
	sharpness_rating int DEFAULT 0 NULL,
	quality_status text DEFAULT 'pending'::text NULL,
	quality_feedback text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT media_files_category_check CHECK ((category = ANY (ARRAY['before'::text, 'after'::text, 'other'::text]))),
	CONSTRAINT media_files_media_type_check CHECK ((media_type = ANY (ARRAY['photo'::text, 'video'::text]))),
	CONSTRAINT media_files_quality_status_check CHECK ((quality_status = ANY (ARRAY['pending'::text, 'pass'::text, 'fail'::text, 'accepted'::text]))),
	CONSTRAINT media_files_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_media_files_category ON public.media_files USING btree (category);
CREATE INDEX idx_media_files_media_type ON public.media_files USING btree (media_type);
CREATE INDEX idx_media_files_practice_session ON public.media_files USING btree (practice_id, patient_photo_id);
CREATE INDEX idx_media_files_upload_timestamp ON public.media_files USING btree (upload_timestamp DESC);
CREATE INDEX idx_media_files_quality_score ON public.media_files USING btree (quality_score DESC);
CREATE INDEX idx_media_files_quality_status ON public.media_files USING btree (quality_status);

-- Table Triggers

create trigger update_media_files_updated_at before
update
    on
    public.media_files for each row execute function update_updated_at_column();


-- public.media_posts definition

-- Drop table

-- DROP TABLE public.media_posts;

CREATE TABLE public.media_posts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	file_name text NOT NULL,
	file_path text NOT NULL,
	bucket_name text DEFAULT 'media-uploads'::text NOT NULL,
	image_url text NOT NULL,
	caption text DEFAULT ''::text NOT NULL,
	hashtags text NULL,
	target_platforms jsonb DEFAULT '["Instagram"]'::jsonb NULL,
	media_type text DEFAULT 'photo'::text NULL,
	media_id text NULL,
	permalink text NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	error_message text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	posted_at timestamptz NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT media_posts_media_type_check CHECK ((media_type = ANY (ARRAY['photo'::text, 'video'::text]))),
	CONSTRAINT media_posts_pkey PRIMARY KEY (id),
	CONSTRAINT media_posts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text, 'posted'::text])))
);
CREATE INDEX idx_media_posts_created_at ON public.media_posts USING btree (created_at DESC);
CREATE INDEX idx_media_posts_media_type ON public.media_posts USING btree (media_type);
CREATE INDEX idx_media_posts_posted_at ON public.media_posts USING btree (posted_at DESC) WHERE (posted_at IS NOT NULL);
CREATE INDEX idx_media_posts_search ON public.media_posts USING gin (to_tsvector('english'::regconfig, ((COALESCE(caption, ''::text) || ' '::text) || COALESCE(file_name, ''::text))));
CREATE INDEX idx_media_posts_status ON public.media_posts USING btree (status);
CREATE INDEX idx_media_posts_target_platforms ON public.media_posts USING gin (target_platforms);

-- Table Triggers

create trigger update_media_posts_updated_at before
update
    on
    public.media_posts for each row execute function update_updated_at_column();


-- public.practices definition

-- Drop table

-- DROP TABLE public.practices;

CREATE TABLE public.practices (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	phone text NULL,
	address jsonb NULL,
	logo_url text NULL,
	branding_colors jsonb DEFAULT '{"accent": "#F97316", "primary": "#3B82F6", "secondary": "#14B8A6"}'::jsonb NULL,
	google_drive_folder_id text NULL,
	google_refresh_token text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	isonboarded bool DEFAULT false NULL,
	email text NULL,
	website_url text NULL,
	CONSTRAINT practices_pkey PRIMARY KEY (id)
);


-- public.questionnaire_responses definition

-- Drop table

-- DROP TABLE public.questionnaire_responses;

CREATE TABLE public.questionnaire_responses (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	first_name text NOT NULL,
	last_name text NOT NULL,
	email text NOT NULL,
	question_1 text NULL,
	question_2 text NULL,
	question_3 text NULL,
	question_4 text NULL,
	question_5 text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT questionnaire_responses_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_questionnaire_responses_updated_at before
update
    on
    public.questionnaire_responses for each row execute function update_updated_at_column();


-- public.session_tokens definition

-- Drop table

-- DROP TABLE public.session_tokens;

CREATE TABLE public.session_tokens (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	session_token varchar(255) NOT NULL,
	practice_id varchar(255) NOT NULL,
	created_by varchar(255) NULL,
	expires_at timestamp NOT NULL,
	is_used bool DEFAULT false NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT session_tokens_pkey PRIMARY KEY (id),
	CONSTRAINT session_tokens_session_token_key UNIQUE (session_token)
);
CREATE INDEX idx_session_tokens_expires ON public.session_tokens USING btree (expires_at);
CREATE INDEX idx_session_tokens_practice ON public.session_tokens USING btree (practice_id);
CREATE INDEX idx_session_tokens_token ON public.session_tokens USING btree (session_token);


-- public.business_hours definition

-- Drop table

-- DROP TABLE public.business_hours;

CREATE TABLE public.business_hours (
	practice_id uuid NOT NULL,
	hours jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT business_hours_pkey PRIMARY KEY (practice_id),
	CONSTRAINT business_hours_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id)
);


-- public.content_library definition

-- Drop table

-- DROP TABLE public.content_library;

CREATE TABLE public.content_library (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	title text NOT NULL,
	description text NOT NULL,
	content_type text NOT NULL,
	category text NOT NULL,
	file_name text NOT NULL,
	file_size numeric DEFAULT 0 NULL,
	file_path text DEFAULT ''::text NULL,
	tags _text DEFAULT '{}'::text[] NULL,
	is_active bool DEFAULT true NULL,
	created_by text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT content_library_content_type_check CHECK ((content_type = ANY (ARRAY['article'::text, 'pdf'::text, 'video'::text, 'image'::text]))),
	CONSTRAINT content_library_pkey PRIMARY KEY (id),
	CONSTRAINT content_library_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id) ON DELETE CASCADE
);
CREATE INDEX idx_content_library_category ON public.content_library USING btree (category);
CREATE INDEX idx_content_library_content_type ON public.content_library USING btree (content_type);
CREATE INDEX idx_content_library_is_active ON public.content_library USING btree (is_active);
CREATE INDEX idx_content_library_practice_id ON public.content_library USING btree (practice_id);
CREATE INDEX idx_content_library_tags ON public.content_library USING gin (tags);


-- public.legal_agreements definition

-- Drop table

-- DROP TABLE public.legal_agreements;

CREATE TABLE public.legal_agreements (
	practice_id uuid NOT NULL,
	terms_accepted bool DEFAULT false NULL,
	privacy_policy_accepted bool DEFAULT false NULL,
	hipaa_signature jsonb NULL,
	signed_at timestamptz DEFAULT now() NULL,
	CONSTRAINT legal_agreements_pkey PRIMARY KEY (practice_id),
	CONSTRAINT legal_agreements_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id)
);


-- public.patients definition

-- Drop table

-- DROP TABLE public.patients;

CREATE TABLE public.patients (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	first_name text NOT NULL,
	last_name text NOT NULL,
	email text NOT NULL,
	phone text NOT NULL,
	last_photo_session text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	consent_status text DEFAULT 'active'::text NULL,
	CONSTRAINT patients_pkey PRIMARY KEY (id),
	CONSTRAINT patients_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id) ON DELETE CASCADE
);
CREATE INDEX idx_patients_email ON public.patients USING btree (email);
CREATE INDEX idx_patients_practice_id ON public.patients USING btree (practice_id);


-- public.photo_sessions definition

-- Drop table

-- DROP TABLE public.photo_sessions;

CREATE TABLE public.photo_sessions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	patient_id uuid NOT NULL,
	patient_photo_id text NOT NULL,
	session_date timestamptz DEFAULT now() NOT NULL,
	photos_count int4 DEFAULT 0 NOT NULL,
	storage_folder_path text NOT NULL,
	file_urls _text NULL,
	photo_type text NULL,
	status text DEFAULT 'uploaded'::text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT photo_sessions_pkey PRIMARY KEY (id),
	CONSTRAINT photo_sessions_status_check CHECK ((status = ANY (ARRAY['uploaded'::text, 'processing'::text, 'ready'::text, 'published'::text]))),
	CONSTRAINT photo_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
	CONSTRAINT photo_sessions_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id) ON DELETE CASCADE
);
CREATE INDEX idx_photo_sessions_date ON public.photo_sessions USING btree (session_date);
CREATE INDEX idx_photo_sessions_patient_id ON public.photo_sessions USING btree (patient_id);
CREATE INDEX idx_photo_sessions_practice_id ON public.photo_sessions USING btree (practice_id);
CREATE INDEX idx_photo_sessions_status ON public.photo_sessions USING btree (status);


-- public.social_media_accounts definition

-- Drop table

-- DROP TABLE public.social_media_accounts;

CREATE TABLE public.social_media_accounts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	platform text NOT NULL,
	username text NULL,
	page_id text NULL,
	is_connected bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT social_media_accounts_pkey PRIMARY KEY (id),
	CONSTRAINT social_media_accounts_practice_id_platform_key UNIQUE (practice_id, platform),
	CONSTRAINT social_media_accounts_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id)
);


-- public.subscriptions definition

-- Drop table

-- DROP TABLE public.subscriptions;

CREATE TABLE public.subscriptions (
	practice_id uuid NOT NULL,
	user_id text NULL,
	customer_id text NULL,
	subscription_id text NULL,
	"plan" text NULL,
	status text NULL,
	last_updated timestamptz DEFAULT now() NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT subscriptions_pkey PRIMARY KEY (practice_id),
	CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'trial'::text]))),
	CONSTRAINT subscriptions_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id)
);


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	email text NOT NULL,
	password_hash text NOT NULL,
	first_name text NOT NULL,
	last_name text NOT NULL,
	"role" text DEFAULT 'staff'::text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'staff'::text, 'owner'::text]))),
	CONSTRAINT users_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id) ON DELETE CASCADE
);
CREATE INDEX idx_users_email ON public.users USING btree (email);


-- public.consent_forms definition

-- Drop table

-- DROP TABLE public.consent_forms;

CREATE TABLE public.consent_forms (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	patient_id uuid NOT NULL,
	procedure_type text NOT NULL,
	notes text NULL,
	consent_date timestamptz DEFAULT now() NOT NULL,
	status text DEFAULT 'completed'::text NULL,
	signature_data text NULL,
	shared_content jsonb DEFAULT '[]'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT consent_forms_pkey PRIMARY KEY (id),
	CONSTRAINT consent_forms_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'pending'::text]))),
	CONSTRAINT consent_forms_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
	CONSTRAINT consent_forms_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id) ON DELETE CASCADE
);
CREATE INDEX idx_consent_forms_consent_date ON public.consent_forms USING btree (consent_date);
CREATE INDEX idx_consent_forms_patient_id ON public.consent_forms USING btree (patient_id);
CREATE INDEX idx_consent_forms_practice_id ON public.consent_forms USING btree (practice_id);
CREATE INDEX idx_consent_forms_procedure_type ON public.consent_forms USING btree (procedure_type);
CREATE INDEX idx_consent_forms_status ON public.consent_forms USING btree (status);


-- public.patient_workflow_sessions definition

-- Drop table

-- DROP TABLE public.patient_workflow_sessions;

CREATE TABLE public.patient_workflow_sessions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	practice_id uuid NOT NULL,
	patient_id uuid NOT NULL,
	current_step text NOT NULL,
	before_photos_completed bool DEFAULT false NULL,
	after_photos_completed bool DEFAULT false NULL,
	before_photos_count int4 DEFAULT 0 NULL,
	after_photos_count int4 DEFAULT 0 NULL,
	session_started_at timestamptz DEFAULT now() NULL,
	before_completed_at timestamptz NULL,
	after_completed_at timestamptz NULL,
	workflow_completed_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT patient_workflow_sessions_current_step_check CHECK ((current_step = ANY (ARRAY['before_photos'::text, 'after_photos'::text, 'completed'::text]))),
	CONSTRAINT patient_workflow_sessions_pkey PRIMARY KEY (id),
	CONSTRAINT patient_workflow_sessions_practice_id_patient_id_key UNIQUE (practice_id, patient_id),
	CONSTRAINT patient_workflow_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
	CONSTRAINT patient_workflow_sessions_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id)
);



-- DROP FUNCTION public.cleanup_expired_tokens();

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM session_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$function$
;

-- DROP FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

-- DROP FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;