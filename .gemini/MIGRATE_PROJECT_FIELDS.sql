-- 1. 기존 Project 테이블의 custom_data(JSON)에서 fields 정보를 추출하여 project_fields 테이블로 이관
-- 이 스크립트는 한 번만 실행하면 됩니다.
DO $$
DECLARE
    r RECORD;
    field_slug TEXT;
    field_id_val INTEGER;
    fields_json JSONB;
BEGIN
    FOR r IN SELECT project_id, custom_data FROM public."Project" WHERE custom_data IS NOT NULL
    LOOP
        BEGIN
            -- custom_data가 string인 경우와 jsonb인 경우 모두 대응
            IF jsonb_typeof(r.custom_data::jsonb) = 'string' THEN
                 fields_json := (r.custom_data::text)::jsonb -> 'fields';
            ELSE
                 fields_json := r.custom_data::jsonb -> 'fields';
            END IF;

            IF fields_json IS NOT NULL AND jsonb_typeof(fields_json) = 'array' THEN
                FOR field_slug IN SELECT * FROM jsonb_array_elements_text(fields_json)
                LOOP
                    -- Slug로 Field ID 찾기
                    SELECT id INTO field_id_val FROM public.fields WHERE slug = field_slug;
                    
                    IF field_id_val IS NOT NULL THEN
                        -- 중복 무시하고 Insert
                        INSERT INTO public.project_fields (project_id, field_id)
                        VALUES (r.project_id, field_id_val)
                        ON CONFLICT (project_id, field_id) DO NOTHING;
                    END IF;
                END LOOP;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing project %: %', r.project_id, SQLERRM;
        END;
    END LOOP;
END $$;
