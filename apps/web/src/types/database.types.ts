export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_aggregations: {
        Row: {
          activity_ids: Json | null
          aggregated_count: number | null
          aggregation_key: string
          aggregation_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          preview_data: Json | null
          title: string | null
          user_id: string
        }
        Insert: {
          activity_ids?: Json | null
          aggregated_count?: number | null
          aggregation_key: string
          aggregation_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          preview_data?: Json | null
          title?: string | null
          user_id: string
        }
        Update: {
          activity_ids?: Json | null
          aggregated_count?: number | null
          aggregation_key?: string
          aggregation_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          preview_data?: Json | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          change_summary: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          workflow_id: string | null
          workflow_status: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          change_summary?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          workflow_id?: string | null
          workflow_status?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          change_summary?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          workflow_id?: string | null
          workflow_status?: string | null
        }
        Relationships: []
      }
      admin_ai_settings: {
        Row: {
          auto_generate_enabled: boolean | null
          auto_generate_time: string | null
          custom_instruction: string | null
          default_categories: string[] | null
          gemini_model: string | null
          id: number
          max_daily_topics: number | null
          target_region: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_generate_enabled?: boolean | null
          auto_generate_time?: string | null
          custom_instruction?: string | null
          default_categories?: string[] | null
          gemini_model?: string | null
          id?: number
          max_daily_topics?: number | null
          target_region?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_generate_enabled?: boolean | null
          auto_generate_time?: string | null
          custom_instruction?: string | null
          default_categories?: string[] | null
          gemini_model?: string | null
          id?: number
          max_daily_topics?: number | null
          target_region?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          action_category: string | null
          admin_id: string | null
          admin_name: string | null
          created_at: string | null
          details: Json | null
          diff_jsonb: Json | null
          dual_auth_admin_id: string | null
          dual_auth_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          performed_by: string | null
          previous_value: Json | null
          reason: string | null
          requires_dual_auth: boolean | null
          resource: string | null
          target_id: string | null
          target_table: string | null
          target_user_email: string | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_category?: string | null
          admin_id?: string | null
          admin_name?: string | null
          created_at?: string | null
          details?: Json | null
          diff_jsonb?: Json | null
          dual_auth_admin_id?: string | null
          dual_auth_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          performed_by?: string | null
          previous_value?: Json | null
          reason?: string | null
          requires_dual_auth?: boolean | null
          resource?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_category?: string | null
          admin_id?: string | null
          admin_name?: string | null
          created_at?: string | null
          details?: Json | null
          diff_jsonb?: Json | null
          dual_auth_admin_id?: string | null
          dual_auth_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          performed_by?: string | null
          previous_value?: Json | null
          reason?: string | null
          requires_dual_auth?: boolean | null
          resource?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      admin_workflow_triggers: {
        Row: {
          admin_id: string
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          response: Json | null
          status: string
          workflow_name: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          response?: Json | null
          status: string
          workflow_name: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          response?: Json | null
          status?: string
          workflow_name?: string
        }
        Relationships: []
      }
      agent_wallets: {
        Row: {
          account_name: string | null
          created_at: string | null
          daily_limit_bdt: number | null
          id: string
          is_active: boolean | null
          last_reset_date: string | null
          method: string | null
          phone_number: string
          qr_code_url: string | null
          used_today_bdt: number | null
          wallet_type: string | null
        }
        Insert: {
          account_name?: string | null
          created_at?: string | null
          daily_limit_bdt?: number | null
          id?: string
          is_active?: boolean | null
          last_reset_date?: string | null
          method?: string | null
          phone_number: string
          qr_code_url?: string | null
          used_today_bdt?: number | null
          wallet_type?: string | null
        }
        Update: {
          account_name?: string | null
          created_at?: string | null
          daily_limit_bdt?: number | null
          id?: string
          is_active?: boolean | null
          last_reset_date?: string | null
          method?: string | null
          phone_number?: string
          qr_code_url?: string | null
          used_today_bdt?: number | null
          wallet_type?: string | null
        }
        Relationships: []
      }
      ai_ab_tests: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          model_a_id: string
          model_a_metrics: Json | null
          model_b_id: string
          model_b_metrics: Json | null
          name: string
          start_date: string | null
          status: string | null
          traffic_split_a: number
          traffic_split_b: number
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          model_a_id: string
          model_a_metrics?: Json | null
          model_b_id: string
          model_b_metrics?: Json | null
          name: string
          start_date?: string | null
          status?: string | null
          traffic_split_a: number
          traffic_split_b: number
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          model_a_id?: string
          model_a_metrics?: Json | null
          model_b_id?: string
          model_b_metrics?: Json | null
          name?: string
          start_date?: string | null
          status?: string | null
          traffic_split_a?: number
          traffic_split_b?: number
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_ab_tests_model_a_id_fkey"
            columns: ["model_a_id"]
            isOneToOne: false
            referencedRelation: "ai_model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_ab_tests_model_b_id_fkey"
            columns: ["model_b_id"]
            isOneToOne: false
            referencedRelation: "ai_model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_ab_tests_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "ai_model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_configs: {
        Row: {
          agent_key: string
          agent_name: string
          created_at: string | null
          daily_token_limit: number | null
          description: string | null
          id: string
          last_run_at: string | null
          model_name: string | null
          pipeline: string | null
          status: string | null
          system_prompt: string
          temperature: number | null
          total_tokens_spent: number | null
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          agent_name: string
          created_at?: string | null
          daily_token_limit?: number | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          model_name?: string | null
          pipeline?: string | null
          status?: string | null
          system_prompt?: string
          temperature?: number | null
          total_tokens_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          agent_name?: string
          created_at?: string | null
          daily_token_limit?: number | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          model_name?: string | null
          pipeline?: string | null
          status?: string | null
          system_prompt?: string
          temperature?: number | null
          total_tokens_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_circuit_breaker_state: {
        Row: {
          failure_count: number | null
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          opened_at: string | null
          service: string
          status: string
          success_count: number | null
          threshold: number
          timeout_ms: number
          updated_at: string | null
        }
        Insert: {
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          opened_at?: string | null
          service: string
          status: string
          success_count?: number | null
          threshold?: number
          timeout_ms?: number
          updated_at?: string | null
        }
        Update: {
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          opened_at?: string | null
          service?: string
          status?: string
          success_count?: number | null
          threshold?: number
          timeout_ms?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_daily_topics: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          generated_at: string | null
          id: string
          market_id: string | null
          rejected_reason: string | null
          status: string | null
          suggested_category: string | null
          suggested_description: string | null
          suggested_question: string
          suggested_title: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          generated_at?: string | null
          id?: string
          market_id?: string | null
          rejected_reason?: string | null
          status?: string | null
          suggested_category?: string | null
          suggested_description?: string | null
          suggested_question: string
          suggested_title: string
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          generated_at?: string | null
          id?: string
          market_id?: string | null
          rejected_reason?: string | null
          status?: string | null
          suggested_category?: string | null
          suggested_description?: string | null
          suggested_question?: string
          suggested_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_daily_topics_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "ai_daily_topics_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_event_pipelines: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          event_id: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          pipeline_type: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          pipeline_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          pipeline_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_evidence_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          cross_verification_score: number | null
          expires_at: string
          id: string
          query: string
          source_types: string[] | null
          sources: Json
          total_sources: number | null
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          cross_verification_score?: number | null
          expires_at: string
          id?: string
          query: string
          source_types?: string[] | null
          sources: Json
          total_sources?: number | null
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          cross_verification_score?: number | null
          expires_at?: string
          id?: string
          query?: string
          source_types?: string[] | null
          sources?: Json
          total_sources?: number | null
        }
        Relationships: []
      }
      ai_model_versions: {
        Row: {
          accuracy: number | null
          avg_latency_ms: number | null
          canary_traffic_percent: number | null
          created_at: string | null
          dataset_size: number | null
          deployment_status: string | null
          f1_score: number | null
          id: string
          is_canary: boolean | null
          model_type: string
          precision: number | null
          recall: number | null
          training_date: string | null
          training_parameters: Json | null
          updated_at: string | null
          version: string
        }
        Insert: {
          accuracy?: number | null
          avg_latency_ms?: number | null
          canary_traffic_percent?: number | null
          created_at?: string | null
          dataset_size?: number | null
          deployment_status?: string | null
          f1_score?: number | null
          id?: string
          is_canary?: boolean | null
          model_type: string
          precision?: number | null
          recall?: number | null
          training_date?: string | null
          training_parameters?: Json | null
          updated_at?: string | null
          version: string
        }
        Update: {
          accuracy?: number | null
          avg_latency_ms?: number | null
          canary_traffic_percent?: number | null
          created_at?: string | null
          dataset_size?: number | null
          deployment_status?: string | null
          f1_score?: number | null
          id?: string
          is_canary?: boolean | null
          model_type?: string
          precision?: number | null
          recall?: number | null
          training_date?: string | null
          training_parameters?: Json | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          agent_name: string
          description: string | null
          id: string
          is_active: boolean | null
          system_prompt: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          agent_name: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          system_prompt: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          agent_name?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          system_prompt?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key_secret_name: string | null
          base_url: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string
          provider_name: string
          temperature: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          api_key_secret_name?: string | null
          base_url?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model: string
          provider_name: string
          temperature?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          api_key_secret_name?: string | null
          base_url?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          provider_name?: string
          temperature?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_rate_limit_state: {
        Row: {
          id: string
          request_count: number | null
          request_limit: number
          service: string
          updated_at: string | null
          window_ms: number
          window_start: string | null
        }
        Insert: {
          id?: string
          request_count?: number | null
          request_limit: number
          service: string
          updated_at?: string | null
          window_ms: number
          window_start?: string | null
        }
        Update: {
          id?: string
          request_count?: number | null
          request_limit?: number
          service?: string
          updated_at?: string | null
          window_ms?: number
          window_start?: string | null
        }
        Relationships: []
      }
      ai_resolution_pipelines: {
        Row: {
          bangladesh_context: Json | null
          bangladesh_division: string | null
          completed_at: string | null
          confidence_level: string | null
          created_at: string | null
          deliberation_model_version: string | null
          deliberation_output: Json | null
          detected_language: string | null
          explanation_model_version: string | null
          explanation_output: Json | null
          final_confidence: number | null
          final_outcome: string | null
          id: string
          is_bangladesh_context: boolean | null
          market_id: string
          pipeline_id: string
          query: string
          recommended_action: string | null
          retrieval_output: Json | null
          started_at: string | null
          status: string | null
          synthesis_model_version: string | null
          synthesis_output: Json | null
          total_execution_time_ms: number | null
          updated_at: string | null
        }
        Insert: {
          bangladesh_context?: Json | null
          bangladesh_division?: string | null
          completed_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          deliberation_model_version?: string | null
          deliberation_output?: Json | null
          detected_language?: string | null
          explanation_model_version?: string | null
          explanation_output?: Json | null
          final_confidence?: number | null
          final_outcome?: string | null
          id?: string
          is_bangladesh_context?: boolean | null
          market_id: string
          pipeline_id: string
          query: string
          recommended_action?: string | null
          retrieval_output?: Json | null
          started_at?: string | null
          status?: string | null
          synthesis_model_version?: string | null
          synthesis_output?: Json | null
          total_execution_time_ms?: number | null
          updated_at?: string | null
        }
        Update: {
          bangladesh_context?: Json | null
          bangladesh_division?: string | null
          completed_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          deliberation_model_version?: string | null
          deliberation_output?: Json | null
          detected_language?: string | null
          explanation_model_version?: string | null
          explanation_output?: Json | null
          final_confidence?: number | null
          final_outcome?: string | null
          id?: string
          is_bangladesh_context?: boolean | null
          market_id?: string
          pipeline_id?: string
          query?: string
          recommended_action?: string | null
          retrieval_output?: Json | null
          started_at?: string | null
          status?: string | null
          synthesis_model_version?: string | null
          synthesis_output?: Json | null
          total_execution_time_ms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_resolution_pipelines_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "ai_resolution_pipelines_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_topic_configs: {
        Row: {
          ai_model: string | null
          context_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          focus_areas: string[] | null
          generation_count: number | null
          generation_schedule: string | null
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          max_tokens: number | null
          name: string
          news_sources: Json | null
          prompt_template: string
          search_keywords: string[] | null
          temperature: number | null
          topics_per_generation: number | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          context_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          focus_areas?: string[] | null
          generation_count?: number | null
          generation_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          max_tokens?: number | null
          name: string
          news_sources?: Json | null
          prompt_template?: string
          search_keywords?: string[] | null
          temperature?: number | null
          topics_per_generation?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          context_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          focus_areas?: string[] | null
          generation_count?: number | null
          generation_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          max_tokens?: number | null
          name?: string
          news_sources?: Json | null
          prompt_template?: string
          search_keywords?: string[] | null
          temperature?: number | null
          topics_per_generation?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_topic_generation_jobs: {
        Row: {
          completed_at: string | null
          config_id: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          keywords_used: string[] | null
          prompt_sent: string | null
          raw_response: string | null
          sources_used: Json | null
          started_at: string | null
          status: string | null
          topics_count: number | null
          topics_generated: Json | null
        }
        Insert: {
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          keywords_used?: string[] | null
          prompt_sent?: string | null
          raw_response?: string | null
          sources_used?: Json | null
          started_at?: string | null
          status?: string | null
          topics_count?: number | null
          topics_generated?: Json | null
        }
        Update: {
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          keywords_used?: string[] | null
          prompt_sent?: string | null
          raw_response?: string | null
          sources_used?: Json | null
          started_at?: string | null
          status?: string | null
          topics_count?: number | null
          topics_generated?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_topic_generation_jobs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "ai_topic_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          agent_key: string | null
          calls_count: number | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          tokens_used: number | null
          usage_date: string | null
        }
        Insert: {
          agent_key?: string | null
          calls_count?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          tokens_used?: number | null
          usage_date?: string | null
        }
        Update: {
          agent_key?: string | null
          calls_count?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          tokens_used?: number | null
          usage_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agent_configs"
            referencedColumns: ["agent_key"]
          },
        ]
      }
      analytics_snapshots_daily: {
        Row: {
          active_traders_daily: number | null
          avg_risk_score: number | null
          burn_rate_estimate: number | null
          churned_users_estimate: number | null
          created_at: string | null
          date: string
          gross_revenue: number | null
          high_risk_users_count: number | null
          id: string
          net_revenue: number | null
          new_users_count: number | null
          retention_rate_d30: number | null
          runway_days_estimate: number | null
          system_leverage_ratio: number | null
          total_users_count: number | null
          total_volume: number | null
          trade_count: number | null
        }
        Insert: {
          active_traders_daily?: number | null
          avg_risk_score?: number | null
          burn_rate_estimate?: number | null
          churned_users_estimate?: number | null
          created_at?: string | null
          date: string
          gross_revenue?: number | null
          high_risk_users_count?: number | null
          id?: string
          net_revenue?: number | null
          new_users_count?: number | null
          retention_rate_d30?: number | null
          runway_days_estimate?: number | null
          system_leverage_ratio?: number | null
          total_users_count?: number | null
          total_volume?: number | null
          trade_count?: number | null
        }
        Update: {
          active_traders_daily?: number | null
          avg_risk_score?: number | null
          burn_rate_estimate?: number | null
          churned_users_estimate?: number | null
          created_at?: string | null
          date?: string
          gross_revenue?: number | null
          high_risk_users_count?: number | null
          id?: string
          net_revenue?: number | null
          new_users_count?: number | null
          retention_rate_d30?: number | null
          runway_days_estimate?: number | null
          system_leverage_ratio?: number | null
          total_users_count?: number | null
          total_volume?: number | null
          trade_count?: number | null
        }
        Relationships: []
      }
      analytics_snapshots_hourly: {
        Row: {
          active_traders_count: number | null
          active_users_session_count: number | null
          avg_spread_bps: number | null
          bucket_start: string
          created_at: string | null
          fill_rate_percent: number | null
          gross_revenue: number | null
          id: string
          net_revenue: number | null
          new_users_count: number | null
          open_interest: number | null
          total_volume: number | null
          trade_count: number | null
          user_rewards_paid: number | null
          velocity: number | null
        }
        Insert: {
          active_traders_count?: number | null
          active_users_session_count?: number | null
          avg_spread_bps?: number | null
          bucket_start: string
          created_at?: string | null
          fill_rate_percent?: number | null
          gross_revenue?: number | null
          id?: string
          net_revenue?: number | null
          new_users_count?: number | null
          open_interest?: number | null
          total_volume?: number | null
          trade_count?: number | null
          user_rewards_paid?: number | null
          velocity?: number | null
        }
        Update: {
          active_traders_count?: number | null
          active_users_session_count?: number | null
          avg_spread_bps?: number | null
          bucket_start?: string
          created_at?: string | null
          fill_rate_percent?: number | null
          gross_revenue?: number | null
          id?: string
          net_revenue?: number | null
          new_users_count?: number | null
          open_interest?: number | null
          total_volume?: number | null
          trade_count?: number | null
          user_rewards_paid?: number | null
          velocity?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          audit_type: string | null
          created_at: string | null
          description: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_state: Json | null
          previous_state: Json | null
          reserve_ratio: number | null
          status: string | null
          user_agent: string | null
          variance: number | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          audit_type?: string | null
          created_at?: string | null
          description?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_state?: Json | null
          previous_state?: Json | null
          reserve_ratio?: number | null
          status?: string | null
          user_agent?: string | null
          variance?: number | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          audit_type?: string | null
          created_at?: string | null
          description?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_state?: Json | null
          previous_state?: Json | null
          reserve_ratio?: number | null
          status?: string | null
          user_agent?: string | null
          variance?: number | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          condition_type: string | null
          condition_value: number | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          rarity: string | null
        }
        Insert: {
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id: string
          name: string
          rarity?: string | null
        }
        Update: {
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      balance_holds: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          reference_id: string | null
          released_at: string | null
          released_by: string | null
          released_reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          reference_id?: string | null
          released_at?: string | null
          released_by?: string | null
          released_reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          reference_id?: string | null
          released_at?: string | null
          released_by?: string | null
          released_reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bd_cricket_events: {
        Row: {
          bangladesh_result: string | null
          created_at: string | null
          id: string
          is_home: boolean | null
          key_players: string[] | null
          market_relevance: boolean | null
          match_date: string
          match_type: string
          opponent: string
          player_of_match: string | null
          venue: string | null
        }
        Insert: {
          bangladesh_result?: string | null
          created_at?: string | null
          id?: string
          is_home?: boolean | null
          key_players?: string[] | null
          market_relevance?: boolean | null
          match_date: string
          match_type: string
          opponent: string
          player_of_match?: string | null
          venue?: string | null
        }
        Update: {
          bangladesh_result?: string | null
          created_at?: string | null
          id?: string
          is_home?: boolean | null
          key_players?: string[] | null
          market_relevance?: boolean | null
          match_date?: string
          match_type?: string
          opponent?: string
          player_of_match?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      bd_divisions: {
        Row: {
          area_sq_km: number | null
          headquarters: string | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
          population_2021: number | null
        }
        Insert: {
          area_sq_km?: number | null
          headquarters?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
          population_2021?: number | null
        }
        Update: {
          area_sq_km?: number | null
          headquarters?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
          population_2021?: number | null
        }
        Relationships: []
      }
      bd_economic_indicators: {
        Row: {
          change_percent: number | null
          created_at: string | null
          id: string
          indicator_date: string
          indicator_name: string
          is_verified: boolean | null
          previous_value: number | null
          source: string | null
          unit: string | null
          value: number
        }
        Insert: {
          change_percent?: number | null
          created_at?: string | null
          id?: string
          indicator_date: string
          indicator_name: string
          is_verified?: boolean | null
          previous_value?: number | null
          source?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          change_percent?: number | null
          created_at?: string | null
          id?: string
          indicator_date?: string
          indicator_name?: string
          is_verified?: boolean | null
          previous_value?: number | null
          source?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      bd_news_sources: {
        Row: {
          authority_score: number
          category: string
          contact_info: Json | null
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          is_government: boolean | null
          name: string
          source_type: string
          updated_at: string | null
        }
        Insert: {
          authority_score: number
          category: string
          contact_info?: Json | null
          created_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          is_government?: boolean | null
          name: string
          source_type: string
          updated_at?: string | null
        }
        Update: {
          authority_score?: number
          category?: string
          contact_info?: Json | null
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          is_government?: boolean | null
          name?: string
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bd_political_events: {
        Row: {
          created_at: string | null
          description: string
          event_date: string
          event_type: string
          id: string
          is_resolved: boolean | null
          locations: string[] | null
          market_impact_score: number | null
          outcome_summary: string | null
          parties_involved: string[] | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_date: string
          event_type: string
          id?: string
          is_resolved?: boolean | null
          locations?: string[] | null
          market_impact_score?: number | null
          outcome_summary?: string | null
          parties_involved?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_date?: string
          event_type?: string
          id?: string
          is_resolved?: boolean | null
          locations?: string[] | null
          market_impact_score?: number | null
          outcome_summary?: string | null
          parties_involved?: string[] | null
        }
        Relationships: []
      }
      burn_events: {
        Row: {
          burn_rate: number
          burned_amount: number
          created_at: string
          event_id: string
          id: string
          market_id: string | null
          status: string
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          burn_rate?: number
          burned_amount?: number
          created_at?: string
          event_id: string
          id?: string
          market_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          burn_rate?: number
          burned_amount?: number
          created_at?: string
          event_id?: string
          id?: string
          market_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cancellation_records: {
        Row: {
          average_fill_price: number | null
          cancel_type: string
          cancellation_reason: string | null
          cancellation_signature: string | null
          cancelled_by: string | null
          client_request_id: string | null
          created_at: string | null
          filled_quantity_before: number
          final_cancelled_quantity: number | null
          final_filled_quantity: number | null
          hard_cancelled_at: string | null
          id: string
          order_id: string
          race_condition_detected: boolean | null
          race_resolution: string | null
          released_collateral: number
          remaining_quantity: number
          requested_at: string
          sequence_number: number
          soft_cancelled_at: string | null
        }
        Insert: {
          average_fill_price?: number | null
          cancel_type: string
          cancellation_reason?: string | null
          cancellation_signature?: string | null
          cancelled_by?: string | null
          client_request_id?: string | null
          created_at?: string | null
          filled_quantity_before?: number
          final_cancelled_quantity?: number | null
          final_filled_quantity?: number | null
          hard_cancelled_at?: string | null
          id?: string
          order_id: string
          race_condition_detected?: boolean | null
          race_resolution?: string | null
          released_collateral?: number
          remaining_quantity: number
          requested_at?: string
          sequence_number: number
          soft_cancelled_at?: string | null
        }
        Update: {
          average_fill_price?: number | null
          cancel_type?: string
          cancellation_reason?: string | null
          cancellation_signature?: string | null
          cancelled_by?: string | null
          client_request_id?: string | null
          created_at?: string | null
          filled_quantity_before?: number
          final_cancelled_quantity?: number | null
          final_filled_quantity?: number | null
          hard_cancelled_at?: string | null
          id?: string
          order_id?: string
          race_condition_detected?: boolean | null
          race_resolution?: string | null
          released_collateral?: number
          remaining_quantity?: number
          requested_at?: string
          sequence_number?: number
          soft_cancelled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "partial_fill_state"
            referencedColumns: ["order_id"]
          },
        ]
      }
      category_settings: {
        Row: {
          category: string
          pause_reason: string | null
          paused_at: string | null
          paused_by: string | null
          trading_status: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          trading_status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          trading_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_attachments: {
        Row: {
          comment_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          thumbnail_url: string | null
          title: string | null
          type: Database["public"]["Enums"]["attachment_type"]
          url: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["attachment_type"]
          url: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["attachment_type"]
          url?: string
        }
        Relationships: []
      }
      comment_flags: {
        Row: {
          comment_id: string
          created_at: string | null
          details: string | null
          id: string
          is_resolved: boolean | null
          reason: Database["public"]["Enums"]["flag_reason"]
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          is_resolved?: boolean | null
          reason: Database["public"]["Enums"]["flag_reason"]
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          is_resolved?: boolean | null
          reason?: Database["public"]["Enums"]["flag_reason"]
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "market_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_moderation_queue: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          comment_id: string
          created_at: string | null
          flagged_categories: string[] | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sentiment_mismatch: boolean | null
          spam_score: number | null
          status: Database["public"]["Enums"]["moderation_status"] | null
          toxicity_score: number | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          comment_id: string
          created_at?: string | null
          flagged_categories?: string[] | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment_mismatch?: boolean | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["moderation_status"] | null
          toxicity_score?: number | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          comment_id?: string
          created_at?: string | null
          flagged_categories?: string[] | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment_mismatch?: boolean | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["moderation_status"] | null
          toxicity_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          user_reputation_at_vote: number | null
          vote_type: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          user_reputation_at_vote?: number | null
          vote_type: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          user_reputation_at_vote?: number | null
          vote_type?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          is_deleted: boolean | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trading_settings: {
        Row: {
          allocation_amount: number | null
          allocation_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_position_size: number | null
          stop_loss_percent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allocation_amount?: number | null
          allocation_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_position_size?: number | null
          stop_loss_percent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allocation_amount?: number | null
          allocation_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_position_size?: number | null
          stop_loss_percent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_trading_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      deposit_attempts: {
        Row: {
          affiliate_used: boolean | null
          created_at: string | null
          id: string
          method: string | null
          selected_seller_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_used?: boolean | null
          created_at?: string | null
          id?: string
          method?: string | null
          selected_seller_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_used?: boolean | null
          created_at?: string | null
          id?: string
          method?: string | null
          selected_seller_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          bdt_amount: number | null
          created_at: string | null
          exchange_rate: number | null
          id: string
          payment_method: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          sender_number: string | null
          status: string | null
          txn_id: string | null
          usdt_amount: number | null
          user_id: string | null
        }
        Insert: {
          bdt_amount?: number | null
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          payment_method?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          sender_number?: string | null
          status?: string | null
          txn_id?: string | null
          usdt_amount?: number | null
          user_id?: string | null
        }
        Update: {
          bdt_amount?: number | null
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          payment_method?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          sender_number?: string | null
          status?: string | null
          txn_id?: string | null
          usdt_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      dispute_records: {
        Row: {
          assigned_judge: string | null
          bond_amount: number
          bond_locked_at: string | null
          bond_status: string | null
          community_votes_no: number | null
          community_votes_yes: number | null
          created_at: string | null
          dispute_reason: string
          dispute_type: string | null
          disputed_by: string
          event_id: string
          evidence_files: string[] | null
          evidence_urls: string[] | null
          id: string
          judge_notes: string | null
          resolution_system_id: string | null
          resolved_at: string | null
          ruling: string | null
          ruling_at: string | null
          ruling_reason: string | null
          status: string | null
          updated_at: string | null
          voting_ends_at: string | null
        }
        Insert: {
          assigned_judge?: string | null
          bond_amount: number
          bond_locked_at?: string | null
          bond_status?: string | null
          community_votes_no?: number | null
          community_votes_yes?: number | null
          created_at?: string | null
          dispute_reason: string
          dispute_type?: string | null
          disputed_by: string
          event_id: string
          evidence_files?: string[] | null
          evidence_urls?: string[] | null
          id?: string
          judge_notes?: string | null
          resolution_system_id?: string | null
          resolved_at?: string | null
          ruling?: string | null
          ruling_at?: string | null
          ruling_reason?: string | null
          status?: string | null
          updated_at?: string | null
          voting_ends_at?: string | null
        }
        Update: {
          assigned_judge?: string | null
          bond_amount?: number
          bond_locked_at?: string | null
          bond_status?: string | null
          community_votes_no?: number | null
          community_votes_yes?: number | null
          created_at?: string | null
          dispute_reason?: string
          dispute_type?: string | null
          disputed_by?: string
          event_id?: string
          evidence_files?: string[] | null
          evidence_urls?: string[] | null
          id?: string
          judge_notes?: string | null
          resolution_system_id?: string | null
          resolved_at?: string | null
          ruling?: string | null
          ruling_at?: string | null
          ruling_reason?: string | null
          status?: string | null
          updated_at?: string | null
          voting_ends_at?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          bond_amount: number
          bond_currency: string | null
          bond_locked_at: string
          bond_released_at: string | null
          challenge_reason: string
          challenger_id: string
          challenger_reward: number | null
          child_dispute_id: string | null
          created_at: string | null
          deadline_at: string
          dispute_id: string
          evidence_urls: string[] | null
          expected_outcome: string
          final_outcome: string | null
          id: string
          level: string
          market_id: string
          parent_dispute_id: string | null
          pipeline_id: string | null
          proposer_id: string | null
          resolution_details: Json | null
          resolution_method: string | null
          resolution_outcome: string | null
          resolved_at: string | null
          reward_distributed: boolean | null
          status: string
          treasury_fee: number | null
        }
        Insert: {
          bond_amount: number
          bond_currency?: string | null
          bond_locked_at: string
          bond_released_at?: string | null
          challenge_reason: string
          challenger_id: string
          challenger_reward?: number | null
          child_dispute_id?: string | null
          created_at?: string | null
          deadline_at: string
          dispute_id: string
          evidence_urls?: string[] | null
          expected_outcome: string
          final_outcome?: string | null
          id?: string
          level: string
          market_id: string
          parent_dispute_id?: string | null
          pipeline_id?: string | null
          proposer_id?: string | null
          resolution_details?: Json | null
          resolution_method?: string | null
          resolution_outcome?: string | null
          resolved_at?: string | null
          reward_distributed?: boolean | null
          status?: string
          treasury_fee?: number | null
        }
        Update: {
          bond_amount?: number
          bond_currency?: string | null
          bond_locked_at?: string
          bond_released_at?: string | null
          challenge_reason?: string
          challenger_id?: string
          challenger_reward?: number | null
          child_dispute_id?: string | null
          created_at?: string | null
          deadline_at?: string
          dispute_id?: string
          evidence_urls?: string[] | null
          expected_outcome?: string
          final_outcome?: string | null
          id?: string
          level?: string
          market_id?: string
          parent_dispute_id?: string | null
          pipeline_id?: string | null
          proposer_id?: string | null
          resolution_details?: Json | null
          resolution_method?: string | null
          resolution_outcome?: string | null
          resolved_at?: string | null
          reward_distributed?: boolean | null
          status?: string
          treasury_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_child_dispute_id_fkey"
            columns: ["child_dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "disputes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_parent_dispute_id_fkey"
            columns: ["parent_dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "ai_resolution_pipelines"
            referencedColumns: ["pipeline_id"]
          },
          {
            foreignKeyName: "disputes_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          ai_confidence_threshold: number | null
          ai_keywords: string[] | null
          ai_sources: string[] | null
          answer_type: string | null
          answer1: string | null
          answer2: string | null
          banner_url: string | null
          category: string
          category_id: string | null
          condition_id: string | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          current_liquidity: number | null
          current_no_price: number | null
          current_stage: string | null
          current_yes_price: number | null
          description: string | null
          ends_at: string | null
          estimated_resume_at: string | null
          event_date: string | null
          featured_until: string | null
          id: string
          image_url: string | null
          initial_liquidity: number | null
          is_featured: boolean | null
          is_trending: boolean | null
          is_verified: boolean | null
          liquidity_score: number | null
          market_id: string | null
          metadata: Json | null
          name: string | null
          name_en: string | null
          neg_risk: boolean | null
          pause_reason: string | null
          paused_at: string | null
          paused_by: string | null
          price_24h_change: number | null
          price_change_24h: number | null
          question: string
          resolution_delay: number
          resolution_delay_hours: number | null
          resolution_method: string | null
          resolution_outcome: string | null
          resolution_source: string | null
          resolution_value: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_outcome: number | null
          resolves_at: string | null
          search_vector: unknown
          slug: string
          starts_at: string | null
          status: string
          subcategory: string | null
          tags: Json | null
          thumbnail_url: string | null
          ticker: string | null
          title: string
          token1: string | null
          token2: string | null
          total_trades: number | null
          total_volume: number | null
          trading_closes_at: string | null
          trading_opens_at: string | null
          trading_volume_24h: number | null
          trending_score: number | null
          unique_traders: number | null
          updated_at: string | null
          winning_token: string | null
        }
        Insert: {
          ai_confidence_threshold?: number | null
          ai_keywords?: string[] | null
          ai_sources?: string[] | null
          answer_type?: string | null
          answer1?: string | null
          answer2?: string | null
          banner_url?: string | null
          category?: string
          category_id?: string | null
          condition_id?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          current_liquidity?: number | null
          current_no_price?: number | null
          current_stage?: string | null
          current_yes_price?: number | null
          description?: string | null
          ends_at?: string | null
          estimated_resume_at?: string | null
          event_date?: string | null
          featured_until?: string | null
          id?: string
          image_url?: string | null
          initial_liquidity?: number | null
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          liquidity_score?: number | null
          market_id?: string | null
          metadata?: Json | null
          name?: string | null
          name_en?: string | null
          neg_risk?: boolean | null
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          price_24h_change?: number | null
          price_change_24h?: number | null
          question: string
          resolution_delay?: number
          resolution_delay_hours?: number | null
          resolution_method?: string | null
          resolution_outcome?: string | null
          resolution_source?: string | null
          resolution_value?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_outcome?: number | null
          resolves_at?: string | null
          search_vector?: unknown
          slug: string
          starts_at?: string | null
          status?: string
          subcategory?: string | null
          tags?: Json | null
          thumbnail_url?: string | null
          ticker?: string | null
          title?: string
          token1?: string | null
          token2?: string | null
          total_trades?: number | null
          total_volume?: number | null
          trading_closes_at?: string | null
          trading_opens_at?: string | null
          trading_volume_24h?: number | null
          trending_score?: number | null
          unique_traders?: number | null
          updated_at?: string | null
          winning_token?: string | null
        }
        Update: {
          ai_confidence_threshold?: number | null
          ai_keywords?: string[] | null
          ai_sources?: string[] | null
          answer_type?: string | null
          answer1?: string | null
          answer2?: string | null
          banner_url?: string | null
          category?: string
          category_id?: string | null
          condition_id?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          current_liquidity?: number | null
          current_no_price?: number | null
          current_stage?: string | null
          current_yes_price?: number | null
          description?: string | null
          ends_at?: string | null
          estimated_resume_at?: string | null
          event_date?: string | null
          featured_until?: string | null
          id?: string
          image_url?: string | null
          initial_liquidity?: number | null
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          liquidity_score?: number | null
          market_id?: string | null
          metadata?: Json | null
          name?: string | null
          name_en?: string | null
          neg_risk?: boolean | null
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          price_24h_change?: number | null
          price_change_24h?: number | null
          question?: string
          resolution_delay?: number
          resolution_delay_hours?: number | null
          resolution_method?: string | null
          resolution_outcome?: string | null
          resolution_source?: string | null
          resolution_value?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_outcome?: number | null
          resolves_at?: string | null
          search_vector?: unknown
          slug?: string
          starts_at?: string | null
          status?: string
          subcategory?: string | null
          tags?: Json | null
          thumbnail_url?: string | null
          ticker?: string | null
          title?: string
          token1?: string | null
          token2?: string | null
          total_trades?: number | null
          total_volume?: number | null
          trading_closes_at?: string | null
          trading_opens_at?: string | null
          trading_volume_24h?: number | null
          trending_score?: number | null
          unique_traders?: number | null
          updated_at?: string | null
          winning_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "events_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          bdt_to_usdt: number
          change_percentage: number | null
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string
          previous_rate: number | null
          rate: number | null
          source: string | null
          updated_at: string
          usdt_to_bdt: number
        }
        Insert: {
          bdt_to_usdt: number
          change_percentage?: number | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          previous_rate?: number | null
          rate?: number | null
          source?: string | null
          updated_at?: string
          usdt_to_bdt: number
        }
        Update: {
          bdt_to_usdt?: number
          change_percentage?: number | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          previous_rate?: number | null
          rate?: number | null
          source?: string | null
          updated_at?: string
          usdt_to_bdt?: number
        }
        Relationships: []
      }
      expert_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_reason: string | null
          completed_at: string | null
          event_id: string
          expert_id: string
          id: string
          responded_at: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_reason?: string | null
          completed_at?: string | null
          event_id: string
          expert_id: string
          id?: string
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_reason?: string | null
          completed_at?: string | null
          event_id?: string
          expert_id?: string
          id?: string
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "expert_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_assignments_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_panel"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string | null
          description: string | null
          icon_color: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          min_accuracy: number | null
          min_predictions: number | null
          min_reputation_score: number | null
          min_streak: number | null
          name: string
          rarity: Database["public"]["Enums"]["badge_rarity"] | null
          short_description: string | null
          verification_required: boolean | null
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at?: string | null
          description?: string | null
          icon_color?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          min_accuracy?: number | null
          min_predictions?: number | null
          min_reputation_score?: number | null
          min_streak?: number | null
          name: string
          rarity?: Database["public"]["Enums"]["badge_rarity"] | null
          short_description?: string | null
          verification_required?: boolean | null
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string | null
          description?: string | null
          icon_color?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          min_accuracy?: number | null
          min_predictions?: number | null
          min_reputation_score?: number | null
          min_streak?: number | null
          name?: string
          rarity?: Database["public"]["Enums"]["badge_rarity"] | null
          short_description?: string | null
          verification_required?: boolean | null
        }
        Relationships: []
      }
      expert_panel: {
        Row: {
          accuracy_rate: number | null
          availability_status: string | null
          bio: string | null
          correct_votes: number | null
          created_at: string | null
          credentials: string | null
          email: string | null
          expert_name: string
          expert_rating: number | null
          id: string
          incorrect_votes: number | null
          is_active: boolean | null
          is_verified: boolean | null
          last_vote_at: string | null
          phone: string | null
          reputation_score: number | null
          specializations: string[]
          total_votes: number | null
          updated_at: string | null
          user_id: string
          verification_documents: string[] | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          accuracy_rate?: number | null
          availability_status?: string | null
          bio?: string | null
          correct_votes?: number | null
          created_at?: string | null
          credentials?: string | null
          email?: string | null
          expert_name: string
          expert_rating?: number | null
          id?: string
          incorrect_votes?: number | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_vote_at?: string | null
          phone?: string | null
          reputation_score?: number | null
          specializations: string[]
          total_votes?: number | null
          updated_at?: string | null
          user_id: string
          verification_documents?: string[] | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          accuracy_rate?: number | null
          availability_status?: string | null
          bio?: string | null
          correct_votes?: number | null
          created_at?: string | null
          credentials?: string | null
          email?: string | null
          expert_name?: string
          expert_rating?: number | null
          id?: string
          incorrect_votes?: number | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_vote_at?: string | null
          phone?: string | null
          reputation_score?: number | null
          specializations?: string[]
          total_votes?: number | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: string[] | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      expert_panel_members: {
        Row: {
          accuracy_rate: number | null
          created_at: string | null
          credibility_score: number | null
          expertise: string[] | null
          id: string
          is_active: boolean | null
          name: string
          total_reviews: number | null
          user_id: string | null
        }
        Insert: {
          accuracy_rate?: number | null
          created_at?: string | null
          credibility_score?: number | null
          expertise?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          total_reviews?: number | null
          user_id?: string | null
        }
        Update: {
          accuracy_rate?: number | null
          created_at?: string | null
          credibility_score?: number | null
          expertise?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_reviews?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_panel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_panel_reviews: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          consensus_confidence: number | null
          consensus_outcome: string | null
          dispute_id: string
          id: string
          panel_members: string[]
          votes: Json | null
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          consensus_confidence?: number | null
          consensus_outcome?: string | null
          dispute_id: string
          id?: string
          panel_members: string[]
          votes?: Json | null
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          consensus_confidence?: number | null
          consensus_outcome?: string | null
          dispute_id?: string
          id?: string
          panel_members?: string[]
          votes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_panel_reviews_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_votes: {
        Row: {
          ai_feedback: string | null
          ai_relevance_score: number | null
          ai_verification_status: string | null
          confidence_level: number | null
          created_at: string | null
          event_id: string
          expert_id: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          reasoning: string
          verified_at: string | null
          vote_outcome: number
        }
        Insert: {
          ai_feedback?: string | null
          ai_relevance_score?: number | null
          ai_verification_status?: string | null
          confidence_level?: number | null
          created_at?: string | null
          event_id: string
          expert_id: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          reasoning: string
          verified_at?: string | null
          vote_outcome: number
        }
        Update: {
          ai_feedback?: string | null
          ai_relevance_score?: number | null
          ai_verification_status?: string | null
          confidence_level?: number | null
          created_at?: string | null
          event_id?: string
          expert_id?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          reasoning?: string
          verified_at?: string | null
          vote_outcome?: number
        }
        Relationships: [
          {
            foreignKeyName: "expert_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "expert_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_votes_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_panel"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_preferences: {
        Row: {
          auto_expand_threads: boolean | null
          compact_mode: boolean | null
          default_thread_depth: number | null
          email_notifications: boolean | null
          market_movements_weight: number | null
          muted_keywords: string[] | null
          muted_markets: string[] | null
          muted_users: string[] | null
          notifications_pause_until: string | null
          notifications_paused: boolean | null
          push_notifications: boolean | null
          social_interactions_weight: number | null
          system_notifications_weight: number | null
          trader_activity_weight: number | null
          trending_markets_weight: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_expand_threads?: boolean | null
          compact_mode?: boolean | null
          default_thread_depth?: number | null
          email_notifications?: boolean | null
          market_movements_weight?: number | null
          muted_keywords?: string[] | null
          muted_markets?: string[] | null
          muted_users?: string[] | null
          notifications_pause_until?: string | null
          notifications_paused?: boolean | null
          push_notifications?: boolean | null
          social_interactions_weight?: number | null
          system_notifications_weight?: number | null
          trader_activity_weight?: number | null
          trending_markets_weight?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_expand_threads?: boolean | null
          compact_mode?: boolean | null
          default_thread_depth?: number | null
          email_notifications?: boolean | null
          market_movements_weight?: number | null
          muted_keywords?: string[] | null
          muted_markets?: string[] | null
          muted_users?: string[] | null
          notifications_pause_until?: string | null
          notifications_paused?: boolean | null
          push_notifications?: boolean | null
          social_interactions_weight?: number | null
          system_notifications_weight?: number | null
          trader_activity_weight?: number | null
          trending_markets_weight?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fill_records: {
        Row: {
          blockchain_reference: string | null
          counterparty_order_id: string | null
          counterparty_user_id: string | null
          created_at: string | null
          fill_number: number
          filled_at: string | null
          id: string
          is_maker: boolean | null
          order_id: string
          price: number
          quantity: number
          total_value: number
          trade_id: string | null
          transaction_hash: string | null
        }
        Insert: {
          blockchain_reference?: string | null
          counterparty_order_id?: string | null
          counterparty_user_id?: string | null
          created_at?: string | null
          fill_number: number
          filled_at?: string | null
          id?: string
          is_maker?: boolean | null
          order_id: string
          price: number
          quantity: number
          total_value: number
          trade_id?: string | null
          transaction_hash?: string | null
        }
        Update: {
          blockchain_reference?: string | null
          counterparty_order_id?: string | null
          counterparty_user_id?: string | null
          created_at?: string | null
          fill_number?: number
          filled_at?: string | null
          id?: string
          is_maker?: boolean | null
          order_id?: string
          price?: number
          quantity?: number
          total_value?: number
          trade_id?: string | null
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fill_records_counterparty_order_id_fkey"
            columns: ["counterparty_order_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fill_records_counterparty_order_id_fkey"
            columns: ["counterparty_order_id"]
            isOneToOne: false
            referencedRelation: "partial_fill_state"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fill_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fill_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "partial_fill_state"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fill_records_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          requester_id: string
          responded_at: string | null
          status: string | null
          target_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          requester_id: string
          responded_at?: string | null
          status?: string | null
          target_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: string | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      global_sequence: {
        Row: {
          id: number
          last_sequence: number
          updated_at: string | null
        }
        Insert: {
          id?: number
          last_sequence?: number
          updated_at?: string | null
        }
        Update: {
          id?: number
          last_sequence?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      human_review_queue: {
        Row: {
          ai_confidence: number
          ai_explanation: string | null
          ai_outcome: string
          assigned_at: string | null
          assigned_to: string | null
          created_at: string | null
          deadline_at: string
          evidence_summary: Json | null
          final_outcome: string | null
          id: string
          market_id: string
          market_question: string
          pipeline_id: string
          priority: string | null
          reviewed_at: string | null
          reviewer_decision: string | null
          reviewer_notes: string | null
          status: string | null
        }
        Insert: {
          ai_confidence: number
          ai_explanation?: string | null
          ai_outcome: string
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          deadline_at: string
          evidence_summary?: Json | null
          final_outcome?: string | null
          id?: string
          market_id: string
          market_question: string
          pipeline_id: string
          priority?: string | null
          reviewed_at?: string | null
          reviewer_decision?: string | null
          reviewer_notes?: string | null
          status?: string | null
        }
        Update: {
          ai_confidence?: number
          ai_explanation?: string | null
          ai_outcome?: string
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          deadline_at?: string
          evidence_summary?: Json | null
          final_outcome?: string | null
          id?: string
          market_id?: string
          market_question?: string
          pipeline_id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewer_decision?: string | null
          reviewer_notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "human_review_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_review_queue_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "human_review_queue_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_review_queue_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "ai_resolution_pipelines"
            referencedColumns: ["pipeline_id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          key: string
          operation: string
          result: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          key: string
          operation: string
          result?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          key?: string
          operation?: string
          result?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      kyc_admin_overrides: {
        Row: {
          admin_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          override_type: string | null
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          override_type?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          override_type?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string | null
          document_back_url: string | null
          document_front_url: string
          document_type: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_back_url?: string | null
          document_front_url: string
          document_type: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string
          document_type?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kyc_settings: {
        Row: {
          auto_approve_enabled: boolean | null
          auto_approve_max_risk_score: number | null
          id: number
          kyc_globally_required: boolean | null
          required_documents: Json | null
          updated_at: string | null
          updated_by: string | null
          withdrawal_threshold: number | null
        }
        Insert: {
          auto_approve_enabled?: boolean | null
          auto_approve_max_risk_score?: number | null
          id?: number
          kyc_globally_required?: boolean | null
          required_documents?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          withdrawal_threshold?: number | null
        }
        Update: {
          auto_approve_enabled?: boolean | null
          auto_approve_max_risk_score?: number | null
          id?: number
          kyc_globally_required?: boolean | null
          required_documents?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          withdrawal_threshold?: number | null
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string | null
          id: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_data: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          badge_ids: Json | null
          best_trade: number
          created_at: string
          id: string
          loss_count: number
          rank_tier: string
          score: number
          season: string | null
          streak: number
          total_pnl: number
          trade_count: number
          updated_at: string
          user_id: string
          username: string | null
          win_count: number
          win_rate: number | null
          worst_trade: number
        }
        Insert: {
          badge_ids?: Json | null
          best_trade?: number
          created_at?: string
          id?: string
          loss_count?: number
          rank_tier?: string
          score?: number
          season?: string | null
          streak?: number
          total_pnl?: number
          trade_count?: number
          updated_at?: string
          user_id: string
          username?: string | null
          win_count?: number
          win_rate?: number | null
          worst_trade?: number
        }
        Update: {
          badge_ids?: Json | null
          best_trade?: number
          created_at?: string
          id?: string
          loss_count?: number
          rank_tier?: string
          score?: number
          season?: string | null
          streak?: number
          total_pnl?: number
          trade_count?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          win_count?: number
          win_rate?: number | null
          worst_trade?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_cache: {
        Row: {
          best_streak: number | null
          created_at: string | null
          current_streak: number | null
          id: string
          period_end: string
          period_start: string
          realized_pnl: number | null
          risk_score: number | null
          roi: number | null
          score: number | null
          timeframe: string
          trading_volume: number | null
          unrealized_pnl: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          period_end?: string
          period_start?: string
          realized_pnl?: number | null
          risk_score?: number | null
          roi?: number | null
          score?: number | null
          timeframe: string
          trading_volume?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_streak?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          period_end?: string
          period_start?: string
          realized_pnl?: number | null
          risk_score?: number | null
          roi?: number | null
          score?: number | null
          timeframe?: string
          trading_volume?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: number
          min_rank_percentile: number | null
          name: string
          tier_order: number
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: number
          min_rank_percentile?: number | null
          name: string
          tier_order: number
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: number
          min_rank_percentile?: number | null
          name?: string
          tier_order?: number
        }
        Relationships: []
      }
      legal_review_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          draft_id: string
          id: string
          notes: string | null
          priority: string
          status: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          draft_id: string
          id?: string
          notes?: string | null
          priority?: string
          status?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          draft_id?: string
          id?: string
          notes?: string | null
          priority?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_review_queue_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: true
            referencedRelation: "market_creation_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      maker_rebates: {
        Row: {
          adjustment_factor: number | null
          base_rebate_rate: number | null
          claim_status: string | null
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string | null
          final_rebate_rate: number | null
          gross_rebate_amount: number | null
          id: string
          net_rebate_amount: number | null
          payment_completed_at: string | null
          payment_method: string | null
          payment_tx_hash: string | null
          qualifying_volume: number | null
          rebate_period_end: string
          rebate_period_start: string
          spread_multiplier: number | null
          tier_at_calculation: number | null
          tier_benefits: Json | null
          total_maker_volume: number | null
          updated_at: string | null
          user_id: string
          year_month: string
        }
        Insert: {
          adjustment_factor?: number | null
          base_rebate_rate?: number | null
          claim_status?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string | null
          final_rebate_rate?: number | null
          gross_rebate_amount?: number | null
          id?: string
          net_rebate_amount?: number | null
          payment_completed_at?: string | null
          payment_method?: string | null
          payment_tx_hash?: string | null
          qualifying_volume?: number | null
          rebate_period_end: string
          rebate_period_start: string
          spread_multiplier?: number | null
          tier_at_calculation?: number | null
          tier_benefits?: Json | null
          total_maker_volume?: number | null
          updated_at?: string | null
          user_id: string
          year_month: string
        }
        Update: {
          adjustment_factor?: number | null
          base_rebate_rate?: number | null
          claim_status?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string | null
          final_rebate_rate?: number | null
          gross_rebate_amount?: number | null
          id?: string
          net_rebate_amount?: number | null
          payment_completed_at?: string | null
          payment_method?: string | null
          payment_tx_hash?: string | null
          qualifying_volume?: number | null
          rebate_period_end?: string
          rebate_period_start?: string
          spread_multiplier?: number | null
          tier_at_calculation?: number | null
          tier_benefits?: Json | null
          total_maker_volume?: number | null
          updated_at?: string | null
          user_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_rebates_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maker_rebates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maker_volume_tracking: {
        Row: {
          claimed_rebate: number | null
          created_at: string | null
          estimated_rebate: number | null
          id: string
          last_updated: string | null
          maker_volume: number | null
          qualifying_volume: number | null
          rebate_rate: number | null
          rebate_tier: number | null
          resting_time_seconds: number | null
          taker_volume: number | null
          total_spread_contribution: number | null
          user_id: string
          year_month: string
        }
        Insert: {
          claimed_rebate?: number | null
          created_at?: string | null
          estimated_rebate?: number | null
          id?: string
          last_updated?: string | null
          maker_volume?: number | null
          qualifying_volume?: number | null
          rebate_rate?: number | null
          rebate_tier?: number | null
          resting_time_seconds?: number | null
          taker_volume?: number | null
          total_spread_contribution?: number | null
          user_id: string
          year_month: string
        }
        Update: {
          claimed_rebate?: number | null
          created_at?: string | null
          estimated_rebate?: number | null
          id?: string
          last_updated?: string | null
          maker_volume?: number | null
          qualifying_volume?: number | null
          rebate_rate?: number | null
          rebate_tier?: number | null
          resting_time_seconds?: number | null
          taker_volume?: number | null
          total_spread_contribution?: number | null
          user_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_volume_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_deposits: {
        Row: {
          agent_notes: string | null
          agent_wallet_id: string | null
          amount_bdt: number | null
          completed_at: string | null
          created_at: string | null
          expiry_warning_sent: boolean | null
          id: string
          method: string | null
          processing_started_at: string | null
          screenshot_url: string | null
          status: string | null
          transaction_id: string | null
          usdt_rate_used: number | null
          usdt_sent_to_user: number | null
          user_id: string | null
          user_phone_number: string | null
        }
        Insert: {
          agent_notes?: string | null
          agent_wallet_id?: string | null
          amount_bdt?: number | null
          completed_at?: string | null
          created_at?: string | null
          expiry_warning_sent?: boolean | null
          id?: string
          method?: string | null
          processing_started_at?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_id?: string | null
          usdt_rate_used?: number | null
          usdt_sent_to_user?: number | null
          user_id?: string | null
          user_phone_number?: string | null
        }
        Update: {
          agent_notes?: string | null
          agent_wallet_id?: string | null
          amount_bdt?: number | null
          completed_at?: string | null
          created_at?: string | null
          expiry_warning_sent?: boolean | null
          id?: string
          method?: string | null
          processing_started_at?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_id?: string | null
          usdt_rate_used?: number | null
          usdt_sent_to_user?: number | null
          user_id?: string | null
          user_phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_deposits_agent_wallet_id_fkey"
            columns: ["agent_wallet_id"]
            isOneToOne: false
            referencedRelation: "agent_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_comments: {
        Row: {
          content: string
          content_html: string | null
          created_at: string | null
          depth_level: number | null
          downvotes: number | null
          edited_at: string | null
          flag_count: number | null
          id: string
          is_collapsed: boolean | null
          is_deleted: boolean | null
          is_flagged: boolean | null
          like_count: number | null
          likes_count: number | null
          market_id: string | null
          parent_id: string | null
          score: number | null
          sentiment: string | null
          sentiment_score: number | null
          updated_at: string | null
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string | null
          depth_level?: number | null
          downvotes?: number | null
          edited_at?: string | null
          flag_count?: number | null
          id?: string
          is_collapsed?: boolean | null
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          like_count?: number | null
          likes_count?: number | null
          market_id?: string | null
          parent_id?: string | null
          score?: number | null
          sentiment?: string | null
          sentiment_score?: number | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string | null
          depth_level?: number | null
          downvotes?: number | null
          edited_at?: string | null
          flag_count?: number | null
          id?: string
          is_collapsed?: boolean | null
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          like_count?: number | null
          likes_count?: number | null
          market_id?: string | null
          parent_id?: string | null
          score?: number | null
          sentiment?: string | null
          sentiment_score?: number | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_comments_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "market_comments_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "market_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      market_creation_drafts: {
        Row: {
          admin_bypass_legal_review: boolean
          admin_bypass_liquidity: boolean
          admin_bypass_simulation: boolean
          category: string | null
          completed_at: string | null
          confidence_threshold: number | null
          created_at: string
          creator_id: string
          current_stage: string
          deployed_at: string | null
          deployed_market_id: string | null
          deployment_config: Json | null
          deployment_tx_hash: string | null
          description: string | null
          event_id: string | null
          id: string
          image_url: string | null
          legal_review_notes: string | null
          legal_review_status: string | null
          legal_reviewed_at: string | null
          legal_reviewer_id: string | null
          liquidity_amount: number
          liquidity_commitment: number
          liquidity_currency: string
          liquidity_deposited: boolean
          liquidity_tx_hash: string | null
          market_type: string | null
          max_value: number | null
          min_value: number | null
          oracle_config: Json | null
          oracle_type: string | null
          outcomes: Json | null
          previous_version_id: string | null
          question: string | null
          regulatory_risk_level: string | null
          required_confirmations: number
          requires_senior_counsel: boolean
          resolution_criteria: string | null
          resolution_deadline: string | null
          resolution_source: string | null
          resolution_source_url: string | null
          sensitive_topics: string[] | null
          simulation_config: Json | null
          simulation_results: Json | null
          stages_completed: Json
          status: string
          subcategory: string | null
          submitted_at: string | null
          tags: string[] | null
          template_id: string | null
          trading_end_type: string
          trading_fee_percent: number
          unit: string | null
          updated_at: string
          verification_method: Json | null
          version: number
        }
        Insert: {
          admin_bypass_legal_review?: boolean
          admin_bypass_liquidity?: boolean
          admin_bypass_simulation?: boolean
          category?: string | null
          completed_at?: string | null
          confidence_threshold?: number | null
          created_at?: string
          creator_id: string
          current_stage?: string
          deployed_at?: string | null
          deployed_market_id?: string | null
          deployment_config?: Json | null
          deployment_tx_hash?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          legal_review_notes?: string | null
          legal_review_status?: string | null
          legal_reviewed_at?: string | null
          legal_reviewer_id?: string | null
          liquidity_amount?: number
          liquidity_commitment?: number
          liquidity_currency?: string
          liquidity_deposited?: boolean
          liquidity_tx_hash?: string | null
          market_type?: string | null
          max_value?: number | null
          min_value?: number | null
          oracle_config?: Json | null
          oracle_type?: string | null
          outcomes?: Json | null
          previous_version_id?: string | null
          question?: string | null
          regulatory_risk_level?: string | null
          required_confirmations?: number
          requires_senior_counsel?: boolean
          resolution_criteria?: string | null
          resolution_deadline?: string | null
          resolution_source?: string | null
          resolution_source_url?: string | null
          sensitive_topics?: string[] | null
          simulation_config?: Json | null
          simulation_results?: Json | null
          stages_completed?: Json
          status?: string
          subcategory?: string | null
          submitted_at?: string | null
          tags?: string[] | null
          template_id?: string | null
          trading_end_type?: string
          trading_fee_percent?: number
          unit?: string | null
          updated_at?: string
          verification_method?: Json | null
          version?: number
        }
        Update: {
          admin_bypass_legal_review?: boolean
          admin_bypass_liquidity?: boolean
          admin_bypass_simulation?: boolean
          category?: string | null
          completed_at?: string | null
          confidence_threshold?: number | null
          created_at?: string
          creator_id?: string
          current_stage?: string
          deployed_at?: string | null
          deployed_market_id?: string | null
          deployment_config?: Json | null
          deployment_tx_hash?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          legal_review_notes?: string | null
          legal_review_status?: string | null
          legal_reviewed_at?: string | null
          legal_reviewer_id?: string | null
          liquidity_amount?: number
          liquidity_commitment?: number
          liquidity_currency?: string
          liquidity_deposited?: boolean
          liquidity_tx_hash?: string | null
          market_type?: string | null
          max_value?: number | null
          min_value?: number | null
          oracle_config?: Json | null
          oracle_type?: string | null
          outcomes?: Json | null
          previous_version_id?: string | null
          question?: string | null
          regulatory_risk_level?: string | null
          required_confirmations?: number
          requires_senior_counsel?: boolean
          resolution_criteria?: string | null
          resolution_deadline?: string | null
          resolution_source?: string | null
          resolution_source_url?: string | null
          sensitive_topics?: string[] | null
          simulation_config?: Json | null
          simulation_results?: Json | null
          stages_completed?: Json
          status?: string
          subcategory?: string | null
          submitted_at?: string | null
          tags?: string[] | null
          template_id?: string | null
          trading_end_type?: string
          trading_fee_percent?: number
          unit?: string | null
          updated_at?: string
          verification_method?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_creation_drafts_deployed_market_id_fkey"
            columns: ["deployed_market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "market_creation_drafts_deployed_market_id_fkey"
            columns: ["deployed_market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_creation_drafts_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "market_creation_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      market_daily_stats: {
        Row: {
          close_price: number | null
          created_at: string | null
          date: string
          high_price: number | null
          id: string
          low_price: number | null
          market_id: string
          open_price: number | null
          trade_count: number | null
          unique_traders: number | null
          volume: number | null
        }
        Insert: {
          close_price?: number | null
          created_at?: string | null
          date: string
          high_price?: number | null
          id?: string
          low_price?: number | null
          market_id: string
          open_price?: number | null
          trade_count?: number | null
          unique_traders?: number | null
          volume?: number | null
        }
        Update: {
          close_price?: number | null
          created_at?: string | null
          date?: string
          high_price?: number | null
          id?: string
          low_price?: number | null
          market_id?: string
          open_price?: number | null
          trade_count?: number | null
          unique_traders?: number | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_daily_stats_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "market_daily_stats_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_followers: {
        Row: {
          created_at: string | null
          market_id: string
          notify_on_price_change: boolean | null
          notify_on_resolve: boolean | null
          notify_on_trade: boolean | null
          price_alert_threshold: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          market_id: string
          notify_on_price_change?: boolean | null
          notify_on_resolve?: boolean | null
          notify_on_trade?: boolean | null
          price_alert_threshold?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          market_id?: string
          notify_on_price_change?: boolean | null
          notify_on_resolve?: boolean | null
          notify_on_trade?: boolean | null
          price_alert_threshold?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_followers_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "market_followers_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_follows: {
        Row: {
          created_at: string | null
          id: string
          market_id: string
          notification_preferences: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_id: string
          notification_preferences?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          market_id?: string
          notification_preferences?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_follows_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "market_follows_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      market_suggestions: {
        Row: {
          ai_confidence: number | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          source_url: string | null
          status: string | null
          title: string
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          source_url?: string | null
          status?: string | null
          title: string
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          source_url?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      market_templates: {
        Row: {
          category: string | null
          created_at: string
          default_params: Json | null
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          market_type: string
          name: string
          ui_config: Json | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_params?: Json | null
          description?: string | null
          id: string
          is_active?: boolean
          is_premium?: boolean
          market_type: string
          name: string
          ui_config?: Json | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          default_params?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          market_type?: string
          name?: string
          ui_config?: Json | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      markets: {
        Row: {
          admin_bypass_legal_review: boolean | null
          admin_bypass_liquidity: boolean | null
          answer_type: string | null
          answer1: string | null
          answer2: string | null
          auction_data: Json | null
          best_ask: number | null
          best_bid: number | null
          category: string
          close_warned: boolean | null
          condition_id: string | null
          confidence: number | null
          created_at: string | null
          created_by: string | null
          creator_address: string | null
          creator_id: string | null
          current_price_no: number | null
          current_price_yes: number | null
          current_stage: string | null
          current_tick: number | null
          deployed_at: string | null
          deployment_config: Json | null
          deployment_tx_hash: string | null
          description: string | null
          ends_at: string | null
          event_date: string
          event_id: string
          fee_percent: number | null
          id: string
          image_url: string | null
          initial_liquidity: number | null
          is_featured: boolean | null
          last_trade_at: string | null
          last_trade_price: number | null
          legal_review_notes: string | null
          legal_review_status: string | null
          legal_reviewed_at: string | null
          legal_reviewer_id: string | null
          liquidity: number | null
          liquidity_commitment: number | null
          liquidity_deposited: boolean | null
          maker_rebate_percent: number | null
          market_category: string | null
          market_type: Database["public"]["Enums"]["market_type_enum"] | null
          max_price: number | null
          max_tick: number | null
          max_value: number | null
          metadata: Json | null
          min_price: number | null
          min_tick: number | null
          min_value: number | null
          name: string | null
          name_bn: string | null
          neg_risk: boolean | null
          next_phase_time: string | null
          no_price: number | null
          no_price_change_24h: number | null
          no_shares_outstanding: number | null
          oracle_type: string | null
          order_count: number | null
          pending_tick_change: Json | null
          question: string
          question_bn: string | null
          realized_volatility_24h: number | null
          resolution_criteria: string | null
          resolution_data: Json | null
          resolution_deadline: string | null
          resolution_delay: number | null
          resolution_delay_hours: number | null
          resolution_details: Json | null
          resolution_method: string | null
          resolution_source: string | null
          resolution_source_type: string | null
          resolution_source_url: string | null
          resolved_at: string | null
          resolver_reference: string | null
          risk_score: number | null
          scalar_unit: string | null
          simulation_config: Json | null
          simulation_results: Json | null
          slug: string | null
          source_url: string | null
          spread: number | null
          stages_completed: string[] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["market_status"] | null
          subcategory: string | null
          tags: string[] | null
          tick_size: number | null
          token1: string | null
          token2: string | null
          total_volume: number | null
          trader_count: number | null
          trading_closes_at: string
          trading_ends: string | null
          trading_fee_percent: number | null
          trading_phase:
            | Database["public"]["Enums"]["trading_phase_type"]
            | null
          unique_traders: number | null
          unique_traders_24h: number | null
          updated_at: string | null
          volume: number | null
          volume_24h: number | null
          winning_outcome: Database["public"]["Enums"]["outcome_type"] | null
          yes_price: number | null
          yes_price_change_24h: number | null
          yes_shares_outstanding: number | null
        }
        Insert: {
          admin_bypass_legal_review?: boolean | null
          admin_bypass_liquidity?: boolean | null
          answer_type?: string | null
          answer1?: string | null
          answer2?: string | null
          auction_data?: Json | null
          best_ask?: number | null
          best_bid?: number | null
          category?: string
          close_warned?: boolean | null
          condition_id?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          creator_address?: string | null
          creator_id?: string | null
          current_price_no?: number | null
          current_price_yes?: number | null
          current_stage?: string | null
          current_tick?: number | null
          deployed_at?: string | null
          deployment_config?: Json | null
          deployment_tx_hash?: string | null
          description?: string | null
          ends_at?: string | null
          event_date: string
          event_id: string
          fee_percent?: number | null
          id?: string
          image_url?: string | null
          initial_liquidity?: number | null
          is_featured?: boolean | null
          last_trade_at?: string | null
          last_trade_price?: number | null
          legal_review_notes?: string | null
          legal_review_status?: string | null
          legal_reviewed_at?: string | null
          legal_reviewer_id?: string | null
          liquidity?: number | null
          liquidity_commitment?: number | null
          liquidity_deposited?: boolean | null
          maker_rebate_percent?: number | null
          market_category?: string | null
          market_type?: Database["public"]["Enums"]["market_type_enum"] | null
          max_price?: number | null
          max_tick?: number | null
          max_value?: number | null
          metadata?: Json | null
          min_price?: number | null
          min_tick?: number | null
          min_value?: number | null
          name?: string | null
          name_bn?: string | null
          neg_risk?: boolean | null
          next_phase_time?: string | null
          no_price?: number | null
          no_price_change_24h?: number | null
          no_shares_outstanding?: number | null
          oracle_type?: string | null
          order_count?: number | null
          pending_tick_change?: Json | null
          question: string
          question_bn?: string | null
          realized_volatility_24h?: number | null
          resolution_criteria?: string | null
          resolution_data?: Json | null
          resolution_deadline?: string | null
          resolution_delay?: number | null
          resolution_delay_hours?: number | null
          resolution_details?: Json | null
          resolution_method?: string | null
          resolution_source?: string | null
          resolution_source_type?: string | null
          resolution_source_url?: string | null
          resolved_at?: string | null
          resolver_reference?: string | null
          risk_score?: number | null
          scalar_unit?: string | null
          simulation_config?: Json | null
          simulation_results?: Json | null
          slug?: string | null
          source_url?: string | null
          spread?: number | null
          stages_completed?: string[] | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["market_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          tick_size?: number | null
          token1?: string | null
          token2?: string | null
          total_volume?: number | null
          trader_count?: number | null
          trading_closes_at: string
          trading_ends?: string | null
          trading_fee_percent?: number | null
          trading_phase?:
            | Database["public"]["Enums"]["trading_phase_type"]
            | null
          unique_traders?: number | null
          unique_traders_24h?: number | null
          updated_at?: string | null
          volume?: number | null
          volume_24h?: number | null
          winning_outcome?: Database["public"]["Enums"]["outcome_type"] | null
          yes_price?: number | null
          yes_price_change_24h?: number | null
          yes_shares_outstanding?: number | null
        }
        Update: {
          admin_bypass_legal_review?: boolean | null
          admin_bypass_liquidity?: boolean | null
          answer_type?: string | null
          answer1?: string | null
          answer2?: string | null
          auction_data?: Json | null
          best_ask?: number | null
          best_bid?: number | null
          category?: string
          close_warned?: boolean | null
          condition_id?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          creator_address?: string | null
          creator_id?: string | null
          current_price_no?: number | null
          current_price_yes?: number | null
          current_stage?: string | null
          current_tick?: number | null
          deployed_at?: string | null
          deployment_config?: Json | null
          deployment_tx_hash?: string | null
          description?: string | null
          ends_at?: string | null
          event_date?: string
          event_id?: string
          fee_percent?: number | null
          id?: string
          image_url?: string | null
          initial_liquidity?: number | null
          is_featured?: boolean | null
          last_trade_at?: string | null
          last_trade_price?: number | null
          legal_review_notes?: string | null
          legal_review_status?: string | null
          legal_reviewed_at?: string | null
          legal_reviewer_id?: string | null
          liquidity?: number | null
          liquidity_commitment?: number | null
          liquidity_deposited?: boolean | null
          maker_rebate_percent?: number | null
          market_category?: string | null
          market_type?: Database["public"]["Enums"]["market_type_enum"] | null
          max_price?: number | null
          max_tick?: number | null
          max_value?: number | null
          metadata?: Json | null
          min_price?: number | null
          min_tick?: number | null
          min_value?: number | null
          name?: string | null
          name_bn?: string | null
          neg_risk?: boolean | null
          next_phase_time?: string | null
          no_price?: number | null
          no_price_change_24h?: number | null
          no_shares_outstanding?: number | null
          oracle_type?: string | null
          order_count?: number | null
          pending_tick_change?: Json | null
          question?: string
          question_bn?: string | null
          realized_volatility_24h?: number | null
          resolution_criteria?: string | null
          resolution_data?: Json | null
          resolution_deadline?: string | null
          resolution_delay?: number | null
          resolution_delay_hours?: number | null
          resolution_details?: Json | null
          resolution_method?: string | null
          resolution_source?: string | null
          resolution_source_type?: string | null
          resolution_source_url?: string | null
          resolved_at?: string | null
          resolver_reference?: string | null
          risk_score?: number | null
          scalar_unit?: string | null
          simulation_config?: Json | null
          simulation_results?: Json | null
          slug?: string | null
          source_url?: string | null
          spread?: number | null
          stages_completed?: string[] | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["market_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          tick_size?: number | null
          token1?: string | null
          token2?: string | null
          total_volume?: number | null
          trader_count?: number | null
          trading_closes_at?: string
          trading_ends?: string | null
          trading_fee_percent?: number | null
          trading_phase?:
            | Database["public"]["Enums"]["trading_phase_type"]
            | null
          unique_traders?: number | null
          unique_traders_24h?: number | null
          updated_at?: string | null
          volume?: number | null
          volume_24h?: number | null
          winning_outcome?: Database["public"]["Enums"]["outcome_type"] | null
          yes_price?: number | null
          yes_price_change_24h?: number | null
          yes_shares_outstanding?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_markets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_markets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_markets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "markets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          performed_by: string
          reason: string | null
          target_comment_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by: string
          reason?: string | null
          target_comment_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string
          reason?: string | null
          target_comment_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      news_sources: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          bias_rating: string | null
          categories_covered: string[] | null
          country_code: string | null
          created_at: string | null
          failed_fetches: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          is_whitelisted: boolean | null
          language_code: string | null
          last_fetch_at: string | null
          last_fetch_status: string | null
          rate_limit_per_hour: number | null
          requires_authentication: boolean | null
          rss_feed_url: string | null
          scraping_config: Json | null
          source_name: string
          source_type: string | null
          source_url: string
          successful_fetches: number | null
          total_articles_fetched: number | null
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          bias_rating?: string | null
          categories_covered?: string[] | null
          country_code?: string | null
          created_at?: string | null
          failed_fetches?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          is_whitelisted?: boolean | null
          language_code?: string | null
          last_fetch_at?: string | null
          last_fetch_status?: string | null
          rate_limit_per_hour?: number | null
          requires_authentication?: boolean | null
          rss_feed_url?: string | null
          scraping_config?: Json | null
          source_name: string
          source_type?: string | null
          source_url: string
          successful_fetches?: number | null
          total_articles_fetched?: number | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          bias_rating?: string | null
          categories_covered?: string[] | null
          country_code?: string | null
          created_at?: string | null
          failed_fetches?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          is_whitelisted?: boolean | null
          language_code?: string | null
          last_fetch_at?: string | null
          last_fetch_status?: string | null
          rate_limit_per_hour?: number | null
          requires_authentication?: boolean | null
          rss_feed_url?: string | null
          scraping_config?: Json | null
          source_name?: string
          source_type?: string | null
          source_url?: string
          successful_fetches?: number | null
          total_articles_fetched?: number | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          market_resolution_channels: Json | null
          notifications_enabled: boolean | null
          order_fills_channels: Json | null
          position_risk_channels: Json | null
          price_alerts_channels: Json | null
          social_channels: Json | null
          system_maintenance_channels: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_resolution_channels?: Json | null
          notifications_enabled?: boolean | null
          order_fills_channels?: Json | null
          position_risk_channels?: Json | null
          price_alerts_channels?: Json | null
          social_channels?: Json | null
          system_maintenance_channels?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          market_resolution_channels?: Json | null
          notifications_enabled?: boolean | null
          order_fills_channels?: Json | null
          position_risk_channels?: Json | null
          price_alerts_channels?: Json | null
          social_channels?: Json | null
          system_maintenance_channels?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_bn: string | null
          body_en: string
          category: string
          created_at: string | null
          default_channels: Json | null
          id: string
          is_active: boolean | null
          name: string
          title_bn: string | null
          title_en: string
        }
        Insert: {
          body_bn?: string | null
          body_en: string
          category: string
          created_at?: string | null
          default_channels?: Json | null
          id: string
          is_active?: boolean | null
          name: string
          title_bn?: string | null
          title_en: string
        }
        Update: {
          body_bn?: string | null
          body_en?: string
          category?: string
          created_at?: string | null
          default_channels?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          title_bn?: string | null
          title_en?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          market_id: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          sender_id: string | null
          title: string
          trade_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          market_id?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
          title: string
          trade_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          market_id?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
          title?: string
          trade_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "notifications_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_assertions: {
        Row: {
          asserter_id: string | null
          bond_amount: number
          created_at: string | null
          id: string
          is_current_best: boolean | null
          outcome: string
          request_id: string
        }
        Insert: {
          asserter_id?: string | null
          bond_amount: number
          created_at?: string | null
          id?: string
          is_current_best?: boolean | null
          outcome: string
          request_id: string
        }
        Update: {
          asserter_id?: string | null
          bond_amount?: number
          created_at?: string | null
          id?: string
          is_current_best?: boolean | null
          outcome?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oracle_assertions_asserter_id_fkey"
            columns: ["asserter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oracle_assertions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "oracle_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_disputes: {
        Row: {
          admin_response: string | null
          bond_amount: number
          created_at: string | null
          disputer_id: string
          evidence_urls: string[] | null
          id: string
          reason: string
          request_id: string
          resolution_outcome: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          admin_response?: string | null
          bond_amount: number
          created_at?: string | null
          disputer_id: string
          evidence_urls?: string[] | null
          id?: string
          reason: string
          request_id: string
          resolution_outcome?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          admin_response?: string | null
          bond_amount?: number
          created_at?: string | null
          disputer_id?: string
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          request_id?: string
          resolution_outcome?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oracle_disputes_disputer_id_fkey"
            columns: ["disputer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oracle_disputes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "oracle_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oracle_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_requests: {
        Row: {
          ai_analysis: Json | null
          bond_amount: number | null
          bond_currency: string | null
          challenge_window_ends_at: string | null
          confidence_score: number | null
          created_at: string | null
          dispute_count: number | null
          evidence_text: string | null
          evidence_urls: string[] | null
          finalized_at: string | null
          id: string
          is_disputed: boolean | null
          market_id: string
          processed_at: string | null
          proposed_outcome: string | null
          proposer_id: string | null
          reasoning: string | null
          request_type: string
          resolution: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          bond_amount?: number | null
          bond_currency?: string | null
          challenge_window_ends_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dispute_count?: number | null
          evidence_text?: string | null
          evidence_urls?: string[] | null
          finalized_at?: string | null
          id?: string
          is_disputed?: boolean | null
          market_id: string
          processed_at?: string | null
          proposed_outcome?: string | null
          proposer_id?: string | null
          reasoning?: string | null
          request_type: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          bond_amount?: number | null
          bond_currency?: string | null
          challenge_window_ends_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dispute_count?: number | null
          evidence_text?: string | null
          evidence_urls?: string[] | null
          finalized_at?: string | null
          id?: string
          is_disputed?: boolean | null
          market_id?: string
          processed_at?: string | null
          proposed_outcome?: string | null
          proposer_id?: string | null
          reasoning?: string | null
          request_type?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oracle_requests_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "oracle_requests_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oracle_requests_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_verifications: {
        Row: {
          admin_decision: Database["public"]["Enums"]["outcome_type"] | null
          admin_id: string | null
          admin_notes: string | null
          ai_confidence: number | null
          ai_reasoning: string | null
          ai_result: Database["public"]["Enums"]["outcome_type"] | null
          created_at: string | null
          finalized_at: string | null
          id: string
          market_id: string | null
          scraped_data: Json | null
          status: Database["public"]["Enums"]["oracle_status"] | null
        }
        Insert: {
          admin_decision?: Database["public"]["Enums"]["outcome_type"] | null
          admin_id?: string | null
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          ai_result?: Database["public"]["Enums"]["outcome_type"] | null
          created_at?: string | null
          finalized_at?: string | null
          id?: string
          market_id?: string | null
          scraped_data?: Json | null
          status?: Database["public"]["Enums"]["oracle_status"] | null
        }
        Update: {
          admin_decision?: Database["public"]["Enums"]["outcome_type"] | null
          admin_id?: string | null
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          ai_result?: Database["public"]["Enums"]["outcome_type"] | null
          created_at?: string | null
          finalized_at?: string | null
          id?: string
          market_id?: string | null
          scraped_data?: Json | null
          status?: Database["public"]["Enums"]["oracle_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "oracle_verifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oracle_verifications_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "oracle_verifications_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_batches: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          failed_count: number | null
          filled_count: number | null
          id: string
          metadata: Json | null
          order_count: number | null
          status: string | null
          total_cost: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          failed_count?: number | null
          filled_count?: number | null
          id?: string
          metadata?: Json | null
          order_count?: number | null
          status?: string | null
          total_cost?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          failed_count?: number | null
          filled_count?: number | null
          id?: string
          metadata?: Json | null
          order_count?: number | null
          status?: string | null
          total_cost?: number
          user_id?: string
        }
        Relationships: []
      }
      order_book: {
        Row: {
          avg_fill_price: number | null
          created_at: string | null
          fill_count: number | null
          filled: number | null
          gtd_expiry: string | null
          id: string
          is_re_entry: boolean | null
          last_fill_at: string | null
          market_id: string
          order_type: string | null
          original_quantity: number
          parent_order_id: string | null
          post_only: boolean | null
          price: number
          side: string
          size: number
          status: string | null
          tif: Database["public"]["Enums"]["tif_type"] | null
          time_in_force: string | null
          time_priority: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avg_fill_price?: number | null
          created_at?: string | null
          fill_count?: number | null
          filled?: number | null
          gtd_expiry?: string | null
          id?: string
          is_re_entry?: boolean | null
          last_fill_at?: string | null
          market_id: string
          order_type?: string | null
          original_quantity?: number
          parent_order_id?: string | null
          post_only?: boolean | null
          price: number
          side: string
          size: number
          status?: string | null
          tif?: Database["public"]["Enums"]["tif_type"] | null
          time_in_force?: string | null
          time_priority?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avg_fill_price?: number | null
          created_at?: string | null
          fill_count?: number | null
          filled?: number | null
          gtd_expiry?: string | null
          id?: string
          is_re_entry?: boolean | null
          last_fill_at?: string | null
          market_id?: string
          order_type?: string | null
          original_quantity?: number
          parent_order_id?: string | null
          post_only?: boolean | null
          price?: number
          side?: string
          size?: number
          status?: string | null
          tif?: Database["public"]["Enums"]["tif_type"] | null
          time_in_force?: string | null
          time_priority?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "order_book_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "partial_fill_state"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_commitments: {
        Row: {
          commitment_hash: string
          created_at: string | null
          id: string
          market_id: string
          user_id: string
        }
        Insert: {
          commitment_hash: string
          created_at?: string | null
          id?: string
          market_id: string
          user_id: string
        }
        Update: {
          commitment_hash?: string
          created_at?: string | null
          id?: string
          market_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_commitments_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "order_commitments_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          average_fill_price: number | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          fee_amount: number | null
          fee_rate: number | null
          filled_at: string | null
          filled_quantity: number
          id: string
          is_post_only: boolean | null
          is_reduce_only: boolean | null
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason: string | null
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          source: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_v2_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "orders_v2_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_2026_03: {
        Row: {
          average_fill_price: number | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          fee_amount: number | null
          fee_rate: number | null
          filled_at: string | null
          filled_quantity: number
          id: string
          is_post_only: boolean | null
          is_reduce_only: boolean | null
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason: string | null
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          source: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders_2026_04: {
        Row: {
          average_fill_price: number | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          fee_amount: number | null
          fee_rate: number | null
          filled_at: string | null
          filled_quantity: number
          id: string
          is_post_only: boolean | null
          is_reduce_only: boolean | null
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason: string | null
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          source: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders_2026_05: {
        Row: {
          average_fill_price: number | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          fee_amount: number | null
          fee_rate: number | null
          filled_at: string | null
          filled_quantity: number
          id: string
          is_post_only: boolean | null
          is_reduce_only: boolean | null
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason: string | null
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          source: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          reject_reason?: string | null
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders_legacy: {
        Row: {
          average_fill_price: number | null
          batch_id: string | null
          cancelled_at: string | null
          client_order_id: string | null
          created_at: string | null
          display_size: number | null
          expires_at: string | null
          fee_amount: number | null
          fee_rate: number | null
          filled_at: string | null
          filled_quantity: number | null
          id: string
          ip_address: unknown
          is_post_only: boolean | null
          is_reduce_only: boolean | null
          market_id: string | null
          oco_group_id: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          outcome: Database["public"]["Enums"]["outcome_type"]
          parent_order_id: string | null
          price: number
          quantity: number
          refresh_size: number | null
          reject_reason: string | null
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          source: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          stop_price: number | null
          time_in_force: string | null
          total_cost: number | null
          trigger_condition: string | null
          type: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          average_fill_price?: number | null
          batch_id?: string | null
          cancelled_at?: string | null
          client_order_id?: string | null
          created_at?: string | null
          display_size?: number | null
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          ip_address?: unknown
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id?: string | null
          oco_group_id?: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          outcome: Database["public"]["Enums"]["outcome_type"]
          parent_order_id?: string | null
          price: number
          quantity: number
          refresh_size?: number | null
          reject_reason?: string | null
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stop_price?: number | null
          time_in_force?: string | null
          total_cost?: number | null
          trigger_condition?: string | null
          type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          average_fill_price?: number | null
          batch_id?: string | null
          cancelled_at?: string | null
          client_order_id?: string | null
          created_at?: string | null
          display_size?: number | null
          expires_at?: string | null
          fee_amount?: number | null
          fee_rate?: number | null
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          ip_address?: unknown
          is_post_only?: boolean | null
          is_reduce_only?: boolean | null
          market_id?: string | null
          oco_group_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          outcome?: Database["public"]["Enums"]["outcome_type"]
          parent_order_id?: string | null
          price?: number
          quantity?: number
          refresh_size?: number | null
          reject_reason?: string | null
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stop_price?: number | null
          time_in_force?: string | null
          total_cost?: number | null
          trigger_condition?: string | null
          type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "order_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "orders_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_v2: {
        Row: {
          created_at: string
          filled_quantity: number
          id: string
          market_id: string
          price: number
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          status: Database["public"]["Enums"]["order_status"]
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filled_quantity?: number
          id?: string
          market_id: string
          price: number
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          status?: Database["public"]["Enums"]["order_status"]
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filled_quantity?: number
          id?: string
          market_id?: string
          price?: number
          quantity?: number
          side?: Database["public"]["Enums"]["order_side"]
          status?: Database["public"]["Enums"]["order_status"]
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_v2_market_id_fkey1"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "orders_v2_market_id_fkey1"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_v2_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      outcomes: {
        Row: {
          created_at: string | null
          current_price: number | null
          display_order: number | null
          id: string
          image_url: string | null
          is_winning: boolean | null
          label: string
          label_bn: string | null
          market_id: string
          price_change_24h: number | null
          total_volume: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_winning?: boolean | null
          label: string
          label_bn?: string | null
          market_id: string
          price_change_24h?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_winning?: boolean | null
          label?: string
          label_bn?: string | null
          market_id?: string
          price_change_24h?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "outcomes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_seller_cache: {
        Row: {
          active: boolean | null
          affiliate_link: string | null
          expires_at: string | null
          id: string
          method: string | null
          scraped_at: string | null
          sellers_data: Json
        }
        Insert: {
          active?: boolean | null
          affiliate_link?: string | null
          expires_at?: string | null
          id?: string
          method?: string | null
          scraped_at?: string | null
          sellers_data: Json
        }
        Update: {
          active?: boolean | null
          affiliate_link?: string | null
          expires_at?: string | null
          id?: string
          method?: string | null
          scraped_at?: string | null
          sellers_data?: Json
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          receiver_number: string | null
          sender_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          receiver_number?: string | null
          sender_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          method?: Database["public"]["Enums"]["payment_method"]
          receiver_number?: string | null
          sender_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_calculations: {
        Row: {
          calculated_at: string | null
          calculation_type: string
          created_at: string
          current_price: number
          id: string
          market_id: string
          metadata: Json | null
          outcome: string
          payout_amount: number
          position_id: string | null
          profit_loss: number
          purchase_price: number
          shares: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_at?: string | null
          calculation_type?: string
          created_at?: string
          current_price?: number
          id?: string
          market_id: string
          metadata?: Json | null
          outcome?: string
          payout_amount?: number
          position_id?: string | null
          profit_loss?: number
          purchase_price?: number
          shares?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_at?: string | null
          calculation_type?: string
          created_at?: string
          current_price?: number
          id?: string
          market_id?: string
          metadata?: Json | null
          outcome?: string
          payout_amount?: number
          position_id?: string | null
          profit_loss?: number
          purchase_price?: number
          shares?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      platform_wallets: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          method: string
          updated_at: string | null
          wallet_name: string | null
          wallet_number: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          method: string
          updated_at?: string | null
          wallet_name?: string | null
          wallet_number: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          method?: string
          updated_at?: string | null
          wallet_name?: string | null
          wallet_number?: string
        }
        Relationships: []
      }
      position_interventions: {
        Row: {
          amount: number
          created_at: string
          id: string
          intervention_type: string
          market_id: string | null
          metadata: Json | null
          performed_by: string | null
          position_id: string | null
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          intervention_type?: string
          market_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          position_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          intervention_type?: string
          market_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          position_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          average_price: number | null
          created_at: string | null
          id: string
          market_id: string | null
          outcome: Database["public"]["Enums"]["outcome_type"]
          outcome_index: number | null
          quantity: number | null
          realized_pnl: number | null
          side: string | null
          unrealized_pnl: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_price?: number | null
          created_at?: string | null
          id?: string
          market_id?: string | null
          outcome: Database["public"]["Enums"]["outcome_type"]
          outcome_index?: number | null
          quantity?: number | null
          realized_pnl?: number | null
          side?: string | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_price?: number | null
          created_at?: string | null
          id?: string
          market_id?: string | null
          outcome?: Database["public"]["Enums"]["outcome_type"]
          outcome_index?: number | null
          quantity?: number | null
          realized_pnl?: number | null
          side?: string | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          close_price: number | null
          high_price: number | null
          id: string
          interval_type: string | null
          low_price: number | null
          market_id: string
          open_price: number | null
          outcome: string
          outcome_id: string | null
          price: number
          recorded_at: string | null
          volume_24h: number | null
          volume_at_time: number | null
        }
        Insert: {
          close_price?: number | null
          high_price?: number | null
          id?: string
          interval_type?: string | null
          low_price?: number | null
          market_id: string
          open_price?: number | null
          outcome?: string
          outcome_id?: string | null
          price: number
          recorded_at?: string | null
          volume_24h?: number | null
          volume_at_time?: number | null
        }
        Update: {
          close_price?: number | null
          high_price?: number | null
          id?: string
          interval_type?: string | null
          low_price?: number | null
          market_id?: string
          open_price?: number | null
          outcome?: string
          outcome_id?: string | null
          price?: number
          recorded_at?: string | null
          volume_24h?: number | null
          volume_at_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "price_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          daily_withdrawal_limit: number | null
          id: string
          is_admin: boolean | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          last_withdrawal_date: string | null
          referral_code: string | null
          total_deposited: number
          total_withdrawn: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          daily_withdrawal_limit?: number | null
          id: string
          is_admin?: boolean | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          last_withdrawal_date?: string | null
          referral_code?: string | null
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          daily_withdrawal_limit?: number | null
          id?: string
          is_admin?: boolean | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          last_withdrawal_date?: string | null
          referral_code?: string | null
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Relationships: []
      }
      rebate_tiers_config: {
        Row: {
          benefits: Json
          created_at: string | null
          id: number
          is_active: boolean | null
          max_volume: number | null
          min_spread: number
          min_volume: number
          rebate_rate: number
          tier_name: string
        }
        Insert: {
          benefits: Json
          created_at?: string | null
          id: number
          is_active?: boolean | null
          max_volume?: number | null
          min_spread: number
          min_volume: number
          rebate_rate: number
          tier_name: string
        }
        Update: {
          benefits?: Json
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          max_volume?: number | null
          min_spread?: number
          min_volume?: number
          rebate_rate?: number
          tier_name?: string
        }
        Relationships: []
      }
      resolution_feedback: {
        Row: {
          created_at: string | null
          dispute_outcome: string | null
          error_type: string | null
          feedback_score: number | null
          human_corrected_outcome: string | null
          human_reviewer_id: string | null
          id: string
          market_id: string
          pipeline_id: string
          processed_at: string | null
          root_cause: string | null
          was_disputed: boolean | null
        }
        Insert: {
          created_at?: string | null
          dispute_outcome?: string | null
          error_type?: string | null
          feedback_score?: number | null
          human_corrected_outcome?: string | null
          human_reviewer_id?: string | null
          id?: string
          market_id: string
          pipeline_id: string
          processed_at?: string | null
          root_cause?: string | null
          was_disputed?: boolean | null
        }
        Update: {
          created_at?: string | null
          dispute_outcome?: string | null
          error_type?: string | null
          feedback_score?: number | null
          human_corrected_outcome?: string | null
          human_reviewer_id?: string | null
          id?: string
          market_id?: string
          pipeline_id?: string
          processed_at?: string | null
          root_cause?: string | null
          was_disputed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "resolution_feedback_human_reviewer_id_fkey"
            columns: ["human_reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_feedback_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "resolution_feedback_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_feedback_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "ai_resolution_pipelines"
            referencedColumns: ["pipeline_id"]
          },
        ]
      }
      resolvers: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          dispute_count: number | null
          is_active: boolean | null
          name: string
          success_count: number | null
          type: string
          website_url: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          dispute_count?: number | null
          is_active?: boolean | null
          name: string
          success_count?: number | null
          type: string
          website_url?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          dispute_count?: number | null
          is_active?: boolean | null
          name?: string
          success_count?: number | null
          type?: string
          website_url?: string | null
        }
        Relationships: []
      }
      resting_orders: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          market_id: string
          order_id: string
          price: number
          quantity: number
          resting_end_time: string | null
          resting_start_time: string | null
          side: string
          spread_at_placement: number | null
          total_resting_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market_id: string
          order_id: string
          price: number
          quantity: number
          resting_end_time?: string | null
          resting_start_time?: string | null
          side: string
          spread_at_placement?: number | null
          total_resting_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market_id?: string
          order_id?: string
          price?: number
          quantity?: number
          resting_end_time?: string | null
          resting_start_time?: string | null
          side?: string
          spread_at_placement?: number | null
          total_resting_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resting_orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "resting_orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resting_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resting_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          action_taken: string
          admin_instruction_bn: string | null
          created_at: string | null
          id: string
          linked_accounts: Json | null
          reasoning_bn: string | null
          risk_score: number
          suspicious_pattern: string | null
          threat_type: string
          user_id: string | null
        }
        Insert: {
          action_taken: string
          admin_instruction_bn?: string | null
          created_at?: string | null
          id?: string
          linked_accounts?: Json | null
          reasoning_bn?: string | null
          risk_score: number
          suspicious_pattern?: string | null
          threat_type: string
          user_id?: string | null
        }
        Update: {
          action_taken?: string
          admin_instruction_bn?: string | null
          created_at?: string | null
          id?: string
          linked_accounts?: Json | null
          reasoning_bn?: string | null
          risk_score?: number
          suspicious_pattern?: string | null
          threat_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sensitive_topics: {
        Row: {
          auto_flag: boolean
          category: string
          created_at: string
          id: string
          keyword: string
          requires_review: boolean
          risk_level: string
        }
        Insert: {
          auto_flag?: boolean
          category: string
          created_at?: string
          id?: string
          keyword: string
          requires_review?: boolean
          risk_level: string
        }
        Update: {
          auto_flag?: boolean
          category?: string
          created_at?: string
          id?: string
          keyword?: string
          requires_review?: boolean
          risk_level?: string
        }
        Relationships: []
      }
      settlement_batches: {
        Row: {
          batch_id: string
          claim_ids: string[]
          created_at: string | null
          gas_estimate: number | null
          id: string
          market_id: string
          processed_at: string | null
          status: string | null
          total_amount: number
        }
        Insert: {
          batch_id: string
          claim_ids: string[]
          created_at?: string | null
          gas_estimate?: number | null
          id?: string
          market_id: string
          processed_at?: string | null
          status?: string | null
          total_amount: number
        }
        Update: {
          batch_id?: string
          claim_ids?: string[]
          created_at?: string | null
          gas_estimate?: number | null
          id?: string
          market_id?: string
          processed_at?: string | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlement_batches_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "settlement_batches_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_claims: {
        Row: {
          claim_id: string
          claimed_at: string | null
          created_at: string | null
          id: string
          market_id: string
          opt_in_auto_settle: boolean | null
          outcome: string
          payout_amount: number
          relayer_fee: number | null
          shares: number
          status: string | null
          user_id: string
        }
        Insert: {
          claim_id: string
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          market_id: string
          opt_in_auto_settle?: boolean | null
          outcome: string
          payout_amount: number
          relayer_fee?: number | null
          shares: number
          status?: string | null
          user_id: string
        }
        Update: {
          claim_id?: string
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          market_id?: string
          opt_in_auto_settle?: boolean | null
          outcome?: string
          payout_amount?: number
          relayer_fee?: number | null
          shares?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_claims_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "settlement_claims_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_escalations: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          market_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          market_id: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          market_id?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_escalations_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "settlement_escalations_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_escalations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spread_multiplier_config: {
        Row: {
          description: string | null
          id: number
          is_active: boolean | null
          max_spread: number | null
          min_order_size: number
          min_spread: number
          multiplier: number
          spread_tier: string
        }
        Insert: {
          description?: string | null
          id: number
          is_active?: boolean | null
          max_spread?: number | null
          min_order_size: number
          min_spread: number
          multiplier: number
          spread_tier: string
        }
        Update: {
          description?: string | null
          id?: number
          is_active?: boolean | null
          max_spread?: number | null
          min_order_size?: number
          min_spread?: number
          multiplier?: number
          spread_tier?: string
        }
        Relationships: []
      }
      spread_rewards: {
        Row: {
          applied_to_rebate_id: string | null
          avg_order_size: number | null
          avg_spread_7d: number | null
          base_multiplier: number | null
          bonus_amount: number | null
          calculation_date: string
          created_at: string | null
          final_multiplier: number | null
          id: string
          market_id: string
          max_spread: number | null
          meets_min_size: boolean | null
          min_spread: number | null
          size_multiplier: number | null
          spread_percentile: number | null
          spread_tier: string | null
          user_id: string
        }
        Insert: {
          applied_to_rebate_id?: string | null
          avg_order_size?: number | null
          avg_spread_7d?: number | null
          base_multiplier?: number | null
          bonus_amount?: number | null
          calculation_date: string
          created_at?: string | null
          final_multiplier?: number | null
          id?: string
          market_id: string
          max_spread?: number | null
          meets_min_size?: boolean | null
          min_spread?: number | null
          size_multiplier?: number | null
          spread_percentile?: number | null
          spread_tier?: string | null
          user_id: string
        }
        Update: {
          applied_to_rebate_id?: string | null
          avg_order_size?: number | null
          avg_spread_7d?: number | null
          base_multiplier?: number | null
          bonus_amount?: number | null
          calculation_date?: string
          created_at?: string | null
          final_multiplier?: number | null
          id?: string
          market_id?: string
          max_spread?: number | null
          meets_min_size?: boolean | null
          min_spread?: number | null
          size_multiplier?: number | null
          spread_percentile?: number | null
          spread_tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spread_rewards_applied_to_rebate_id_fkey"
            columns: ["applied_to_rebate_id"]
            isOneToOne: false
            referencedRelation: "maker_rebates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spread_rewards_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "spread_rewards_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spread_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trader_subscriptions: {
        Row: {
          created_at: string | null
          follower_id: string | null
          id: string
          trader_id: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          id?: string
          trader_id?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          id?: string
          trader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trader_subscriptions_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trader_subscriptions_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string | null
          executed_at: string
          fee_amount: number | null
          id: string
          maker_fee: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at: string | null
          settlement_status: string | null
          taker_fee: number | null
          taker_id: string
          taker_order_id: string
          trade_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id: string
          taker_order_id: string
          trade_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id?: string
          maker_order_id?: string
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id?: string
          taker_order_id?: string
          trade_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_v2_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_v2_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "trades_v2_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_v2_taker_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades_2026_03: {
        Row: {
          created_at: string | null
          executed_at: string
          fee_amount: number | null
          id: string
          maker_fee: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at: string | null
          settlement_status: string | null
          taker_fee: number | null
          taker_id: string
          taker_order_id: string
          trade_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id: string
          taker_order_id: string
          trade_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id?: string
          maker_order_id?: string
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id?: string
          taker_order_id?: string
          trade_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trades_2026_04: {
        Row: {
          created_at: string | null
          executed_at: string
          fee_amount: number | null
          id: string
          maker_fee: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at: string | null
          settlement_status: string | null
          taker_fee: number | null
          taker_id: string
          taker_order_id: string
          trade_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id: string
          taker_order_id: string
          trade_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id?: string
          maker_order_id?: string
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id?: string
          taker_order_id?: string
          trade_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trades_2026_05: {
        Row: {
          created_at: string | null
          executed_at: string
          fee_amount: number | null
          id: string
          maker_fee: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at: string | null
          settlement_status: string | null
          taker_fee: number | null
          taker_id: string
          taker_order_id: string
          trade_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id: string
          maker_order_id: string
          market_id: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price: number
          quantity: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id: string
          taker_order_id: string
          trade_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          executed_at?: string
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id?: string
          maker_order_id?: string
          market_id?: string
          outcome?: Database["public"]["Enums"]["outcome_type"] | null
          price?: number
          quantity?: number
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id?: string
          taker_order_id?: string
          trade_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trades_legacy: {
        Row: {
          buy_order_id: string | null
          created_at: string | null
          fee_amount: number | null
          id: string
          maker_fee: number | null
          maker_id: string | null
          market_id: string | null
          outcome: Database["public"]["Enums"]["outcome_type"]
          price: number
          quantity: number
          sell_order_id: string | null
          settled_at: string | null
          settlement_status: string | null
          taker_fee: number | null
          taker_id: string | null
          trade_type: string | null
          updated_at: string | null
        }
        Insert: {
          buy_order_id?: string | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id?: string | null
          market_id?: string | null
          outcome: Database["public"]["Enums"]["outcome_type"]
          price: number
          quantity: number
          sell_order_id?: string | null
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id?: string | null
          trade_type?: string | null
          updated_at?: string | null
        }
        Update: {
          buy_order_id?: string | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          maker_fee?: number | null
          maker_id?: string | null
          market_id?: string | null
          outcome?: Database["public"]["Enums"]["outcome_type"]
          price?: number
          quantity?: number
          sell_order_id?: string | null
          settled_at?: string | null
          settlement_status?: string | null
          taker_fee?: number | null
          taker_id?: string | null
          trade_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_buy_order_id_fkey"
            columns: ["buy_order_id"]
            isOneToOne: false
            referencedRelation: "orders_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_buyer_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_sell_order_id_fkey"
            columns: ["sell_order_id"]
            isOneToOne: false
            referencedRelation: "orders_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_seller_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades_v2: {
        Row: {
          executed_at: string
          id: string
          maker_id: string
          maker_order_id: string
          market_id: string
          price: number
          quantity: number
          taker_id: string
          taker_order_id: string
          updated_at: string
        }
        Insert: {
          executed_at?: string
          id?: string
          maker_id: string
          maker_order_id: string
          market_id: string
          price: number
          quantity: number
          taker_id: string
          taker_order_id: string
          updated_at?: string
        }
        Update: {
          executed_at?: string
          id?: string
          maker_id?: string
          maker_order_id?: string
          market_id?: string
          price?: number
          quantity?: number
          taker_id?: string
          taker_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_v2_maker_id_fkey1"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_v2_market_id_fkey1"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "trades_v2_market_id_fkey1"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_v2_taker_id_fkey1"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          id: string
          market_id: string | null
          metadata: Json | null
          order_id: string | null
          trade_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          id?: string
          market_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          trade_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          id?: string
          market_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          trade_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "transactions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          market_id: string
          status: string
          transfer_type: string
          tx_hash: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          market_id: string
          status?: string
          transfer_type?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          market_id?: string
          status?: string
          transfer_type?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      upstash_workflow_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          event_id: string | null
          id: string
          qstash_message_id: string | null
          result: Json | null
          retry_count: number | null
          status: string | null
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          event_id?: string | null
          id?: string
          qstash_message_id?: string | null
          result?: Json | null
          retry_count?: number | null
          status?: string | null
          workflow_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          event_id?: string | null
          id?: string
          qstash_message_id?: string | null
          result?: Json | null
          retry_count?: number | null
          status?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "upstash_workflow_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upstash_workflow_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upstash_workflow_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      usdt_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string | null
          tx_hash: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          tx_hash?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          tx_hash?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          created_at: string | null
          market_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          market_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          market_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "user_bookmarks_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feed_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          notification_preferences: Json | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          notification_preferences?: Json | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          notification_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_internal_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          note_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          note_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          note_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_kyc_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          daily_deposit_limit: number | null
          daily_withdrawal_limit: number | null
          date_of_birth: string | null
          full_name: string | null
          id: string
          id_document_back_url: string | null
          id_document_front_url: string | null
          id_expiry: string | null
          id_number: string | null
          id_type: string | null
          nationality: string | null
          phone_number: string | null
          phone_verified: boolean | null
          postal_code: string | null
          proof_of_address_url: string | null
          rejection_reason: string | null
          risk_factors: Json | null
          risk_score: number | null
          selfie_url: string | null
          state_province: string | null
          submitted_at: string | null
          updated_at: string | null
          verification_status: string
          verification_tier: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          daily_deposit_limit?: number | null
          daily_withdrawal_limit?: number | null
          date_of_birth?: string | null
          full_name?: string | null
          id: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          id_expiry?: string | null
          id_number?: string | null
          id_type?: string | null
          nationality?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          selfie_url?: string | null
          state_province?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          verification_status?: string
          verification_tier?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          daily_deposit_limit?: number | null
          daily_withdrawal_limit?: number | null
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          id_expiry?: string | null
          id_number?: string | null
          id_type?: string | null
          nationality?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          selfie_url?: string | null
          state_province?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          verification_status?: string
          verification_tier?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_leagues: {
        Row: {
          current_points: number | null
          is_promoted: boolean | null
          is_relegated: boolean | null
          last_updated_at: string | null
          league_id: number | null
          user_id: string
        }
        Insert: {
          current_points?: number | null
          is_promoted?: boolean | null
          is_relegated?: boolean | null
          last_updated_at?: string | null
          league_id?: number | null
          user_id: string
        }
        Update: {
          current_points?: number | null
          is_promoted?: boolean | null
          is_relegated?: boolean | null
          last_updated_at?: string | null
          league_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_leagues_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_leagues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_moderation_status: {
        Row: {
          active_strikes: number | null
          appeal_count: number | null
          comment_ban_until: string | null
          created_at: string | null
          is_comment_banned: boolean | null
          is_trade_restricted: boolean | null
          last_appeal_at: string | null
          last_strike_at: string | null
          restriction_reason: string | null
          total_strikes: number | null
          trade_restriction_until: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_strikes?: number | null
          appeal_count?: number | null
          comment_ban_until?: string | null
          created_at?: string | null
          is_comment_banned?: boolean | null
          is_trade_restricted?: boolean | null
          last_appeal_at?: string | null
          last_strike_at?: string | null
          restriction_reason?: string | null
          total_strikes?: number | null
          trade_restriction_until?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_strikes?: number | null
          appeal_count?: number | null
          comment_ban_until?: string | null
          created_at?: string | null
          is_comment_banned?: boolean | null
          is_trade_restricted?: boolean | null
          last_appeal_at?: string | null
          last_strike_at?: string | null
          restriction_reason?: string | null
          total_strikes?: number | null
          trade_restriction_until?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          can_create_events: boolean | null
          created_at: string
          email: string | null
          flags: Json | null
          full_name: string | null
          id: string
          is_admin: boolean
          is_pro: boolean | null
          is_senior_counsel: boolean | null
          is_super_admin: boolean
          kyc_level: number | null
          last_admin_login: string | null
          last_login_at: string | null
          status: Database["public"]["Enums"]["user_account_status"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          can_create_events?: boolean | null
          created_at?: string
          email?: string | null
          flags?: Json | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          is_pro?: boolean | null
          is_senior_counsel?: boolean | null
          is_super_admin?: boolean
          kyc_level?: number | null
          last_admin_login?: string | null
          last_login_at?: string | null
          status?: Database["public"]["Enums"]["user_account_status"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          can_create_events?: boolean | null
          created_at?: string
          email?: string | null
          flags?: Json | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_pro?: boolean | null
          is_senior_counsel?: boolean | null
          is_super_admin?: boolean
          kyc_level?: number | null
          last_admin_login?: string | null
          last_login_at?: string | null
          status?: Database["public"]["Enums"]["user_account_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          accuracy_tier: Database["public"]["Enums"]["accuracy_tier"] | null
          best_streak: number | null
          consistency_score: number | null
          correct_predictions: number | null
          current_streak: number | null
          prediction_accuracy: number | null
          rank_percentile: number | null
          reputation_score: number | null
          social_score: number | null
          total_predictions: number | null
          updated_at: string | null
          user_id: string
          volume_score: number | null
        }
        Insert: {
          accuracy_tier?: Database["public"]["Enums"]["accuracy_tier"] | null
          best_streak?: number | null
          consistency_score?: number | null
          correct_predictions?: number | null
          current_streak?: number | null
          prediction_accuracy?: number | null
          rank_percentile?: number | null
          reputation_score?: number | null
          social_score?: number | null
          total_predictions?: number | null
          updated_at?: string | null
          user_id: string
          volume_score?: number | null
        }
        Update: {
          accuracy_tier?: Database["public"]["Enums"]["accuracy_tier"] | null
          best_streak?: number | null
          consistency_score?: number | null
          correct_predictions?: number | null
          current_streak?: number | null
          prediction_accuracy?: number | null
          rank_percentile?: number | null
          reputation_score?: number | null
          social_score?: number | null
          total_predictions?: number | null
          updated_at?: string | null
          user_id?: string
          volume_score?: number | null
        }
        Relationships: []
      }
      user_status: {
        Row: {
          account_status: string
          can_trade: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          account_status?: string
          can_trade?: boolean | null
          id: string
          updated_at?: string | null
        }
        Update: {
          account_status?: string
          can_trade?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_trading_stats: {
        Row: {
          last_reset_at: string | null
          thirty_day_volume: number | null
          total_maker_rebates_earned: number | null
          user_id: string
        }
        Insert: {
          last_reset_at?: string | null
          thirty_day_volume?: number | null
          total_maker_rebates_earned?: number | null
          user_id: string
        }
        Update: {
          last_reset_at?: string | null
          thirty_day_volume?: number | null
          total_maker_rebates_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trading_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          follower_count: number | null
          following_count: number | null
          full_name: string
          id: string
          is_admin: boolean | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          max_followers: number | null
          phone: string | null
          privacy_tier: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          follower_count?: number | null
          following_count?: number | null
          full_name?: string
          id: string
          is_admin?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          max_followers?: number | null
          phone?: string | null
          privacy_tier?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          follower_count?: number | null
          following_count?: number | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          max_followers?: number | null
          phone?: string | null
          privacy_tier?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      verification_workflows: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          event_category: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          event_category: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          event_category?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          network_type: string | null
          status: string | null
          transaction_type: string
          tx_hash: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          network_type?: string | null
          status?: string | null
          transaction_type: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          network_type?: string | null
          status?: string | null
          transaction_type?: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address_type: string | null
          asset: string | null
          balance: number | null
          created_at: string | null
          currency: string | null
          daily_withdrawal_limit: number | null
          id: string
          is_active: boolean | null
          last_deposit_at: string | null
          last_withdrawal_at: string | null
          locked_balance: number | null
          locked_usdt: number | null
          monthly_withdrawal_limit: number | null
          network_type: string | null
          qr_code_url: string | null
          risk_score: number | null
          total_deposited: number | null
          total_earned: number | null
          total_fees_paid: number | null
          total_withdrawn: number | null
          updated_at: string | null
          usdc_address: string | null
          usdt_address: string | null
          usdt_balance: number | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          address_type?: string | null
          asset?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          daily_withdrawal_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_deposit_at?: string | null
          last_withdrawal_at?: string | null
          locked_balance?: number | null
          locked_usdt?: number | null
          monthly_withdrawal_limit?: number | null
          network_type?: string | null
          qr_code_url?: string | null
          risk_score?: number | null
          total_deposited?: number | null
          total_earned?: number | null
          total_fees_paid?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          usdc_address?: string | null
          usdt_address?: string | null
          usdt_balance?: number | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          address_type?: string | null
          asset?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          daily_withdrawal_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_deposit_at?: string | null
          last_withdrawal_at?: string | null
          locked_balance?: number | null
          locked_usdt?: number | null
          monthly_withdrawal_limit?: number | null
          network_type?: string | null
          qr_code_url?: string | null
          risk_score?: number | null
          total_deposited?: number | null
          total_earned?: number | null
          total_fees_paid?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          usdc_address?: string | null
          usdt_address?: string | null
          usdt_balance?: number | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          balance_hold_id: string | null
          bdt_amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          exchange_rate: number
          id: string
          ip_address: unknown
          mfs_provider: Database["public"]["Enums"]["mfs_provider"]
          processed_at: string | null
          processed_by: string | null
          recipient_name: string | null
          recipient_number: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          transfer_proof_url: string | null
          updated_at: string
          usdt_amount: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          balance_hold_id?: string | null
          bdt_amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          exchange_rate: number
          id?: string
          ip_address?: unknown
          mfs_provider: Database["public"]["Enums"]["mfs_provider"]
          processed_at?: string | null
          processed_by?: string | null
          recipient_name?: string | null
          recipient_number: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transfer_proof_url?: string | null
          updated_at?: string
          usdt_amount: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          balance_hold_id?: string | null
          bdt_amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          exchange_rate?: number
          id?: string
          ip_address?: unknown
          mfs_provider?: Database["public"]["Enums"]["mfs_provider"]
          processed_at?: string | null
          processed_by?: string | null
          recipient_name?: string | null
          recipient_number?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transfer_proof_url?: string | null
          updated_at?: string
          usdt_amount?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_verifications: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          is_verified: boolean
          otp_code: string
          user_id: string
          withdrawal_payload: Json
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          is_verified?: boolean
          otp_code: string
          user_id: string
          withdrawal_payload: Json
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_verified?: boolean
          otp_code?: string
          user_id?: string
          withdrawal_payload?: Json
        }
        Relationships: []
      }
      workflow_analytics_daily: {
        Row: {
          avg_duration_ms: number | null
          created_at: string | null
          execution_date: string | null
          failure_count: number | null
          id: string
          success_count: number | null
          total_executions: number | null
          workflow_name: string
        }
        Insert: {
          avg_duration_ms?: number | null
          created_at?: string | null
          execution_date?: string | null
          failure_count?: number | null
          id?: string
          success_count?: number | null
          total_executions?: number | null
          workflow_name: string
        }
        Update: {
          avg_duration_ms?: number | null
          created_at?: string | null
          execution_date?: string | null
          failure_count?: number | null
          id?: string
          success_count?: number | null
          total_executions?: number | null
          workflow_name?: string
        }
        Relationships: []
      }
      workflow_configs: {
        Row: {
          created_at: string | null
          cron_expression: string | null
          endpoint: string
          execution_time_ms: number | null
          id: string
          is_active: boolean | null
          last_run: string | null
          last_status: string | null
          name: string
          next_run: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cron_expression?: string | null
          endpoint: string
          execution_time_ms?: number | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          last_status?: string | null
          name: string
          next_run?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cron_expression?: string | null
          endpoint?: string
          execution_time_ms?: number | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          last_status?: string | null
          name?: string
          next_run?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_dlq: {
        Row: {
          error: string | null
          event_id: string | null
          failed_at: string | null
          id: string
          payload: Json | null
          workflow_type: string
        }
        Insert: {
          error?: string | null
          event_id?: string | null
          failed_at?: string | null
          id?: string
          payload?: Json | null
          workflow_type: string
        }
        Update: {
          error?: string | null
          event_id?: string | null
          failed_at?: string | null
          id?: string
          payload?: Json | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_dlq_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_dlq_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_dlq_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          confidence: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          escalated: boolean | null
          event_id: string | null
          evidence: Json | null
          execution_time: number | null
          id: string
          max_retries: number | null
          mismatch_detected: boolean | null
          notified: boolean | null
          outcome: string | null
          payload: Json | null
          results: Json | null
          retry_count: number | null
          sources: Json | null
          started_at: string | null
          status: string
          workflow_id: string | null
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          escalated?: boolean | null
          event_id?: string | null
          evidence?: Json | null
          execution_time?: number | null
          id?: string
          max_retries?: number | null
          mismatch_detected?: boolean | null
          notified?: boolean | null
          outcome?: string | null
          payload?: Json | null
          results?: Json | null
          retry_count?: number | null
          sources?: Json | null
          started_at?: string | null
          status: string
          workflow_id?: string | null
          workflow_name: string
          workflow_type?: string
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          escalated?: boolean | null
          event_id?: string | null
          evidence?: Json | null
          execution_time?: number | null
          id?: string
          max_retries?: number | null
          mismatch_detected?: boolean | null
          notified?: boolean | null
          outcome?: string | null
          payload?: Json | null
          results?: Json | null
          retry_count?: number | null
          sources?: Json | null
          started_at?: string | null
          status?: string
          workflow_id?: string | null
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "verification_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          cron_expression: string
          default_payload: Json | null
          description: string | null
          endpoint_url: string
          failed_runs: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_run_status: string | null
          method: string | null
          name: string
          next_run_at: string | null
          schedule_id: string | null
          successful_runs: number | null
          timezone: string | null
          total_runs: number | null
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cron_expression: string
          default_payload?: Json | null
          description?: string | null
          endpoint_url: string
          failed_runs?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_status?: string | null
          method?: string | null
          name: string
          next_run_at?: string | null
          schedule_id?: string | null
          successful_runs?: number | null
          timezone?: string | null
          total_runs?: number | null
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cron_expression?: string
          default_payload?: Json | null
          description?: string | null
          endpoint_url?: string
          failed_runs?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_status?: string | null
          method?: string | null
          name?: string
          next_run_at?: string | null
          schedule_id?: string | null
          successful_runs?: number | null
          timezone?: string | null
          total_runs?: number | null
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          completed_at: string | null
          error_details: string | null
          execution_id: string | null
          id: string
          started_at: string | null
          step_data: Json | null
          step_name: string
          step_status: string
        }
        Insert: {
          completed_at?: string | null
          error_details?: string | null
          execution_id?: string | null
          id?: string
          started_at?: string | null
          step_data?: Json | null
          step_name: string
          step_status: string
        }
        Update: {
          completed_at?: string | null
          error_details?: string | null
          execution_id?: string | null
          id?: string
          started_at?: string | null
          step_data?: Json | null
          step_name?: string
          step_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_cancellations: {
        Row: {
          average_fill_price: number | null
          cancel_type: string | null
          cancellation_reason: string | null
          cancellation_signature: string | null
          cancelled_by: string | null
          client_request_id: string | null
          created_at: string | null
          elapsed_ms: number | null
          filled: number | null
          filled_quantity_before: number | null
          final_cancelled_quantity: number | null
          final_filled_quantity: number | null
          hard_cancelled_at: string | null
          id: string | null
          market_id: string | null
          order_id: string | null
          price: number | null
          race_condition_detected: boolean | null
          race_resolution: string | null
          released_collateral: number | null
          remaining_quantity: number | null
          requested_at: string | null
          sequence_number: number | null
          side: string | null
          size: number | null
          soft_cancelled_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "partial_fill_state"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          email: string | null
          full_name: string | null
          is_admin: boolean | null
          is_super_admin: boolean | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      comment_like_counts: {
        Row: {
          comment_id: string | null
          like_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "market_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_statistics: {
        Row: {
          appeal_disputes: number | null
          final_disputes: number | null
          initial_disputes: number | null
          resolved_disputes: number | null
          success_rate: number | null
          successful_challenges: number | null
          total_bonds_locked: number | null
          total_disputes: number | null
          total_rewards_distributed: number | null
          total_treasury_fees: number | null
        }
        Relationships: []
      }
      leaderboard_mv: {
        Row: {
          loss_count: number | null
          pnl: number | null
          rank: number | null
          rank_tier: string | null
          score: number | null
          streak: number | null
          trade_count: number | null
          user_id: string | null
          username: string | null
          win_count: number | null
          win_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      market_metrics: {
        Row: {
          current_price_no: number | null
          current_price_yes: number | null
          event_id: string | null
          liquidity: number | null
          market_id: string | null
          order_count: number | null
          question: string | null
          status: Database["public"]["Enums"]["market_status"] | null
          trade_count: number | null
          volume_24h: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_markets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_markets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_markets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "markets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      orphaned_events: {
        Row: {
          created_at: string | null
          id: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      partial_fill_state: {
        Row: {
          avg_fill_price: number | null
          fill_count: number | null
          fill_history: Json | null
          filled_quantity: number | null
          gtd_expiry: string | null
          is_re_entry: boolean | null
          last_fill_at: string | null
          market_id: string | null
          order_id: string | null
          original_quantity: number | null
          parent_order_id: string | null
          price: number | null
          remaining_quantity: number | null
          side: string | null
          status: string | null
          tif: Database["public"]["Enums"]["tif_type"] | null
          time_priority: number | null
          user_id: string | null
        }
        Insert: {
          avg_fill_price?: number | null
          fill_count?: number | null
          fill_history?: never
          filled_quantity?: number | null
          gtd_expiry?: string | null
          is_re_entry?: boolean | null
          last_fill_at?: string | null
          market_id?: string | null
          order_id?: string | null
          original_quantity?: number | null
          parent_order_id?: string | null
          price?: number | null
          remaining_quantity?: never
          side?: string | null
          status?: string | null
          tif?: Database["public"]["Enums"]["tif_type"] | null
          time_priority?: number | null
          user_id?: string | null
        }
        Update: {
          avg_fill_price?: number | null
          fill_count?: number | null
          fill_history?: never
          filled_quantity?: number | null
          gtd_expiry?: string | null
          is_re_entry?: boolean | null
          last_fill_at?: string | null
          market_id?: string | null
          order_id?: string | null
          original_quantity?: number | null
          parent_order_id?: string | null
          price?: number | null
          remaining_quantity?: never
          side?: string | null
          status?: string | null
          tif?: Database["public"]["Enums"]["tif_type"] | null
          time_priority?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_event_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "order_book_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_book_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "partial_fill_state"
            referencedColumns: ["order_id"]
          },
        ]
      }
      price_ohlc_1h: {
        Row: {
          close_price: number | null
          high_price: number | null
          hour: string | null
          low_price: number | null
          market_id: string | null
          open_price: number | null
          outcome: string | null
          volume: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_metrics"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "price_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_statistics: {
        Row: {
          auto_settle_rate: number | null
          auto_settled_claims: number | null
          manual_claims: number | null
          total_payout: number | null
          total_relayer_fees: number | null
        }
        Relationships: []
      }
      user_current_rebate_status: {
        Row: {
          available_to_claim: number | null
          benefits: Json | null
          claimed_rebate: number | null
          estimated_rebate: number | null
          last_updated: string | null
          maker_volume: number | null
          qualifying_volume: number | null
          rebate_rate_percent: number | null
          rebate_tier: number | null
          tier_name: string | null
          user_id: string | null
          year_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maker_volume_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_portfolio_v2: {
        Row: {
          average_price: number | null
          current_price_no: number | null
          current_price_yes: number | null
          current_value: number | null
          investment: number | null
          market_id: string | null
          outcome: Database["public"]["Enums"]["outcome_type"] | null
          question: string | null
          shares: number | null
          unrealized_pnl: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "orphaned_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "view_resolvable_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rebate_history: {
        Row: {
          base_rate_percent: number | null
          claim_status: string | null
          claimed_at: string | null
          final_rate_percent: number | null
          gross_rebate_amount: number | null
          net_rebate_amount: number | null
          payment_method: string | null
          payment_tx_hash: string | null
          qualifying_volume: number | null
          rebate_period_end: string | null
          rebate_period_start: string | null
          spread_multiplier: number | null
          tier_name: string | null
          total_maker_volume: number | null
          user_id: string | null
          year_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maker_rebates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_resolvable_events: {
        Row: {
          active_markets: number | null
          end_date: string | null
          event_id: string | null
          event_status: string | null
          market_count: number | null
          title: string | null
        }
        Relationships: []
      }
      vw_expiring_kyc: {
        Row: {
          days_until_expiry: number | null
          full_name: string | null
          id_expiry: string | null
          id_number: string | null
          id_type: string | null
          user_id: string | null
        }
        Insert: {
          days_until_expiry?: never
          full_name?: string | null
          id_expiry?: string | null
          id_number?: string | null
          id_type?: string | null
          user_id?: string | null
        }
        Update: {
          days_until_expiry?: never
          full_name?: string | null
          id_expiry?: string | null
          id_number?: string | null
          id_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workflow_execution_summary: {
        Row: {
          avg_duration_ms: number | null
          failed: number | null
          last_execution: string | null
          partial: number | null
          successful: number | null
          total_executions: number | null
          workflow_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_to_workflow_dlq: {
        Args: {
          p_error_message: string
          p_error_stack?: string
          p_failed_step?: string
          p_workflow_run_id: string
        }
        Returns: string
      }
      admin_credit_wallet:
        | {
            Args: {
              p_admin_id: string
              p_amount: number
              p_currency?: string
              p_reason?: string
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_admin_id: string
              p_amount: number
              p_reason?: string
              p_user_id: string
            }
            Returns: Json
          }
      admin_debit_wallet:
        | {
            Args: {
              p_admin_id: string
              p_amount: number
              p_currency?: string
              p_reason?: string
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_admin_id: string
              p_amount: number
              p_reason?: string
              p_user_id: string
            }
            Returns: Json
          }
      admin_get_user_wallet: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: {
          available_balance: number
          balance: number
          created_at: string
          currency: string
          id: string
          locked_balance: number
          transactions: Json
          updated_at: string
          user_id: string
        }[]
      }
      admin_kyc_action: {
        Args: {
          p_action: string
          p_admin_id: string
          p_reason?: string
          p_rejection_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_update_market_fields: {
        Args: { p_fields: Json; p_market_id: string }
        Returns: Json
      }
      approve_ai_topic: {
        Args: {
          p_admin_id: string
          p_initial_liquidity?: number
          p_topic_id: string
          p_trading_closes_at: string
        }
        Returns: string
      }
      approve_deposit: {
        Args: { p_admin_id: string; p_payment_id: string }
        Returns: boolean
      }
      batch_cancel_orders: {
        Args: { p_order_ids: string[]; p_user_id: string }
        Returns: {
          message: string
          order_id: string
          sequence_number: number
          success: boolean
        }[]
      }
      calculate_daily_ohlc: { Args: { p_date: string }; Returns: undefined }
      calculate_hourly_metrics: { Args: { p_hour: string }; Returns: undefined }
      calculate_market_spread: {
        Args: { p_market_id: string }
        Returns: number
      }
      calculate_reputation_score: {
        Args: { p_correct_votes: number; p_total_votes: number }
        Returns: number
      }
      calculate_spread_multiplier: {
        Args: { p_avg_order_size: number; p_avg_spread: number }
        Returns: number
      }
      calculate_vwap: { Args: { p_order_id: string }; Returns: number }
      calculate_weekly_rebate: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_user_id: string
        }
        Returns: string
      }
      cancel_order: {
        Args: { p_order_id: string; p_user_id?: string }
        Returns: Json
      }
      cancel_order_batch: { Args: { p_batch_id: string }; Returns: Json }
      cancel_order_v2: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      check_ai_topics_health: {
        Args: never
        Returns: {
          check_name: string
          details: string
          is_healthy: boolean
          status: string
        }[]
      }
      check_gtd_expiry: {
        Args: never
        Returns: {
          expired_order_id: string
          released_collateral: number
        }[]
      }
      check_kyc_withdrawal_gate: { Args: { p_user_id: string }; Returns: Json }
      check_sensitive_topics: {
        Args: { p_text: string }
        Returns: {
          category: string
          keyword: string
          requires_review: boolean
          risk_level: string
        }[]
      }
      check_withdrawal_eligibility: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      check_workflow_health: {
        Args: never
        Returns: {
          current_status: string
          is_healthy: boolean
          issues: string
          last_run: string
          next_run: string
          workflow_key: string
        }[]
      }
      claim_rebate: {
        Args: {
          p_payment_method: string
          p_rebate_id: string
          p_user_id: string
        }
        Returns: Json
      }
      cleanup_dormant_accounts: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      cleanup_expired_batches: { Args: never; Returns: Json }
      cleanup_old_notifications: { Args: { p_days?: number }; Returns: Json }
      complete_legal_review: {
        Args: {
          p_draft_id: string
          p_notes?: string
          p_reviewer_id: string
          p_status: string
        }
        Returns: boolean
      }
      create_event_complete:
        | { Args: { p_admin_id: string; p_event_data: Json }; Returns: Json }
        | {
            Args: {
              p_answer_type?: string
              p_category_id: string
              p_description: string
              p_resolution_src?: string
              p_tags: string[]
              p_title: string
            }
            Returns: Json
          }
      create_event_complete_v1: { Args: { event_data: Json }; Returns: Json }
      create_event_complete_v2: {
        Args: {
          answer_type?: string
          category_id: string
          description: string
          tags: string[]
          title: string
        }
        Returns: Json
      }
      create_event_complete_v3: {
        Args: {
          p_answer_type: Database["public"]["Enums"]["answer_type"]
          p_category_id: string
          p_description: string
          p_ends_at: string
          p_resolution_source: string
          p_starts_at: string
          p_tags: Json
          p_title: string
        }
        Returns: Json
      }
      create_event_debug: {
        Args: { p_admin_id: string; p_event_data: Json }
        Returns: Json
      }
      create_event_with_markets: {
        Args: { p_event_data: Json; p_markets_data: Json[] }
        Returns: Json
      }
      create_event_with_resolution: {
        Args: {
          p_admin_id: string
          p_event_data: Json
          p_resolution_config: Json
        }
        Returns: Json
      }
      create_market: {
        Args: { p_ends_at?: string; p_event_id: string; p_slug: string }
        Returns: Json
      }
      create_market_draft:
        | {
            Args: {
              p_creator_id: string
              p_market_type: string
              p_template_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_creator_id: string
              p_event_id?: string
              p_market_type: string
              p_template_id?: string
            }
            Returns: string
          }
      create_market_v2: {
        Args: {
          p_ends_at: string
          p_event_id: string
          p_fee_percent: number
          p_market_type: string
          p_max_tick: number
          p_min_tick: number
          p_slug: string
        }
        Returns: Json
      }
      create_order_batch: {
        Args: { p_orders: Json; p_total_cost: number }
        Returns: Json
      }
      create_price_alert_notification: {
        Args: {
          p_market_id: string
          p_price_change_percent: number
          p_user_id: string
        }
        Returns: string
      }
      create_withdrawal_hold: {
        Args: { p_amount: number; p_user_id: string; p_withdrawal_id: string }
        Returns: string
      }
      create_workflow_execution: {
        Args: {
          p_max_retries?: number
          p_payload?: Json
          p_workflow_type: string
        }
        Returns: string
      }
      credit_wallet: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      debit_wallet: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      deploy_market_full: {
        Args: { p_deployer_id: string; p_draft_id: string }
        Returns: string
      }
      deposit_funds_v2: {
        Args: {
          p_amount: number
          p_method?: string
          p_reference?: string
          p_user_id: string
        }
        Returns: Json
      }
      determine_rebate_tier: {
        Args: { p_monthly_volume: number }
        Returns: number
      }
      dispute_resolution_v2: {
        Args: {
          p_evidence_url?: string
          p_reason: string
          p_request_id: string
        }
        Returns: Json
      }
      event_tags_as_text_array: {
        Args: { p_event_id: string }
        Returns: string[]
      }
      execute_trade_v2: {
        Args: {
          p_buy_order_id: string
          p_maker_id: string
          p_market_id: string
          p_outcome?: Database["public"]["Enums"]["outcome_type"]
          p_price: number
          p_quantity: number
          p_sell_order_id: string
          p_taker_id: string
        }
        Returns: Json
      }
      expire_order: {
        Args: { p_expiry_reason?: string; p_order_id: string }
        Returns: {
          cancel_record_id: string
          released_collateral: number
          success: boolean
        }[]
      }
      expire_stale_orders: { Args: never; Returns: Json }
      fetch_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          loss_count: number
          pnl: number
          rank: number
          rank_tier: string
          score: number
          streak: number
          trade_count: number
          user_id: string
          username: string
          win_count: number
          win_rate: number
        }[]
      }
      follow_market: {
        Args: { p_market_id: string; p_user_id: string }
        Returns: Json
      }
      follow_user: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: Json
      }
      freeze_funds: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      freeze_funds_v2: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      freeze_wallet_v2: {
        Args: { p_freeze?: boolean; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      generate_cancellation_confirmation: {
        Args: { p_cancel_record_id: string }
        Returns: {
          confirmation_data: Json
          signature_payload: string
        }[]
      }
      get_admin_activity_summary: {
        Args: {
          p_admin_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          action_count: number
          action_type: string
          last_action_at: string
        }[]
      }
      get_admin_events: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          answer_type: string
          answer1: string
          answer2: string
          category: string
          created_at: string
          created_by: string
          current_no_price: number
          current_yes_price: number
          description: string
          id: string
          image_url: string
          initial_liquidity: number
          is_featured: boolean
          is_trending: boolean
          market_count: number
          question: string
          resolution_delay: number
          resolution_method: string
          resolver_reference: string
          slug: string
          starts_at: string
          status: string
          subcategory: string
          tags: string[]
          title: string
          total_trades: number
          total_volume: number
          trading_closes_at: string
          unique_traders: number
          updated_at: string
        }[]
      }
      get_ai_topics_summary: {
        Args: never
        Returns: {
          today_generated: number
          total_approved: number
          total_pending: number
          total_rejected: number
        }[]
      }
      get_all_categories: {
        Args: never
        Returns: {
          display_order: number
          icon: string
          is_custom: boolean
          name: string
          slug: string
        }[]
      }
      get_batch_details: { Args: { p_batch_id: string }; Returns: Json }
      get_events_with_resolution: {
        Args: { p_category?: string; p_limit?: number; p_status?: string }
        Returns: {
          category: string
          created_at: string
          id: string
          name: string
          question: string
          resolution_method: string
          resolution_status: string
          status: string
          subcategory: string
          tags: string[]
          trading_closes_at: string
        }[]
      }
      get_exchange_rate_v2: {
        Args: { p_currency_pair?: string }
        Returns: Json
      }
      get_follow_status: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: Json
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          loss_count: number
          pnl: number
          rank: number
          rank_tier: string
          score: number
          streak: number
          trade_count: number
          user_id: string
          username: string
          win_count: number
          win_rate: number
        }[]
      }
      get_leaderboard_v2: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_season?: string
          p_tier?: string
        }
        Returns: {
          loss_count: number
          pnl: number
          rank: number
          rank_tier: string
          score: number
          streak: number
          trade_count: number
          user_id: string
          username: string
          win_count: number
          win_rate: number
        }[]
      }
      get_legal_review_queue: {
        Args: { p_assignee_id?: string }
        Returns: {
          category: string
          draft_id: string
          priority: string
          question: string
          requires_senior: boolean
          risk_level: string
          sensitive_topics: string[]
          submitted_at: string
        }[]
      }
      get_market_comments_threaded: {
        Args: {
          p_limit?: number
          p_market_id: string
          p_offset?: number
          p_sort_by?: string
        }
        Returns: {
          author_reputation: number
          content: string
          created_at: string
          depth_level: number
          downvotes: number
          edited_at: string
          id: string
          is_collapsed: boolean
          is_deleted: boolean
          is_flagged: boolean
          market_id: string
          parent_id: string
          reply_count: number
          score: number
          sentiment: string
          upvotes: number
          user_id: string
        }[]
      }
      get_market_prices: {
        Args: { p_market_id: string }
        Returns: {
          no_price: number
          no_volume: number
          yes_price: number
          yes_volume: number
        }[]
      }
      get_market_stats_summary: { Args: { p_market_id: string }; Returns: Json }
      get_market_stats_v2: { Args: { p_market_id: string }; Returns: Json }
      get_market_trades: {
        Args: { p_limit?: number; p_market_id: string }
        Returns: {
          created_at: string
          id: string
          outcome: Database["public"]["Enums"]["outcome_type"]
          price: number
          quantity: number
          trade_type: string
        }[]
      }
      get_market_trades_v2: {
        Args: { p_limit?: number; p_market_id: string; p_offset?: number }
        Returns: {
          created_at: string
          id: string
          outcome: Database["public"]["Enums"]["outcome_type"]
          price: number
          quantity: number
          trade_type: string
        }[]
      }
      get_next_sequence: { Args: never; Returns: number }
      get_oracle_status_v2: { Args: { p_market_id: string }; Returns: Json }
      get_order_book: {
        Args: { p_depth?: number; p_market_id: string }
        Returns: {
          order_count: number
          price: number
          side: string
          total_quantity: number
        }[]
      }
      get_order_book_depth: {
        Args: { p_depth?: number; p_market_id: string }
        Returns: Json
      }
      get_order_book_v2: {
        Args: {
          p_depth?: number
          p_market_id: string
          p_outcome?: Database["public"]["Enums"]["outcome_type"]
        }
        Returns: {
          order_count: number
          price: number
          side: string
          total_quantity: number
        }[]
      }
      get_orderbook: {
        Args: {
          p_market_id: string
          p_outcome: Database["public"]["Enums"]["outcome_type"]
          p_side: Database["public"]["Enums"]["order_side"]
        }
        Returns: {
          price: number
          quantity: number
          total: number
        }[]
      }
      get_orphaned_event_ids: { Args: never; Returns: string[] }
      get_platform_analytics:
        | { Args: { p_period?: string }; Returns: Json }
        | { Args: { p_metric_type?: string; p_period?: string }; Returns: Json }
      get_platform_stats_v2: { Args: never; Returns: Json }
      get_price_history:
        | {
            Args: { p_hours?: number; p_market_id: string; p_outcome?: string }
            Returns: {
              price: number
              recorded_at: string
              volume_at_time: number
            }[]
          }
        | {
            Args: { p_interval_hours?: number; p_market_id: string }
            Returns: {
              close_price: number
              high_price: number
              low_price: number
              open_price: number
              timestamp_bucket: string
              volume: number
            }[]
          }
      get_price_history_ohlc: {
        Args: { p_interval?: string; p_limit?: number; p_market_id: string }
        Returns: {
          bucket: string
          close_price: number
          high_price: number
          low_price: number
          open_price: number
          trade_count: number
          volume: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: Json }
      get_user_admin_profile: { Args: { p_user_id: string }; Returns: Json }
      get_user_analytics_v2: { Args: { p_user_id: string }; Returns: Json }
      get_user_orders: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          created_at: string
          fee_amount: number
          filled_quantity: number
          id: string
          market_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          outcome: Database["public"]["Enums"]["outcome_type"]
          price: number
          quantity: number
          remaining_quantity: number
          side: Database["public"]["Enums"]["order_side"]
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number
          updated_at: string
        }[]
      }
      get_user_orders_v2: {
        Args: {
          p_limit?: number
          p_market_id?: string
          p_offset?: number
          p_status?: Database["public"]["Enums"]["order_status"]
          p_user_id: string
        }
        Returns: {
          created_at: string
          fee_amount: number
          filled_quantity: number
          id: string
          market_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          outcome: Database["public"]["Enums"]["outcome_type"]
          price: number
          quantity: number
          remaining_quantity: number
          side: Database["public"]["Enums"]["order_side"]
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number
          updated_at: string
        }[]
      }
      get_user_positions_v2: {
        Args: { p_user_id: string }
        Returns: {
          average_price: number
          current_value: number
          market_id: string
          outcome: Database["public"]["Enums"]["outcome_type"]
          quantity: number
          realized_pnl: number
        }[]
      }
      get_user_rank_v2: { Args: { p_user_id: string }; Returns: Json }
      get_wallet_summary_v2: { Args: { p_user_id: string }; Returns: Json }
      get_weighted_expert_consensus: {
        Args: { p_event_id: string }
        Returns: {
          avg_confidence: number
          consensus_percentage: number
          outcome: number
          total_weight: number
          vote_count: number
        }[]
      }
      hard_cancel_order: {
        Args: { p_is_system?: boolean; p_order_id: string; p_user_id?: string }
        Returns: {
          cancel_record_id: string
          filled_during_cancel: number
          final_status: string
          message: string
          released_collateral: number
          sequence_number: number
          success: boolean
        }[]
      }
      increment_agent_usage: {
        Args: { p_agent_key: string; p_tokens: number }
        Returns: undefined
      }
      increment_filled: {
        Args: { p_amount: number; p_order_id: string }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      is_admin_secure: { Args: never; Returns: boolean }
      lock_dispute_bond: {
        Args: { p_amount: number; p_dispute_id: string; p_user_id: string }
        Returns: boolean
      }
      lock_wallet_funds: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      log_admin_action:
        | {
            Args: { p_action: string; p_admin_id: string; p_details: string }
            Returns: Json
          }
        | {
            Args: {
              p_action_type: string
              p_admin_id: string
              p_ip_address?: unknown
              p_new_values?: Json
              p_old_values?: Json
              p_reason?: string
              p_resource_id: string
              p_resource_type: string
              p_user_agent?: string
              p_workflow_id?: string
            }
            Returns: string
          }
      log_admin_action_v2: {
        Args: {
          p_action: string
          p_admin_id: string
          p_diff_jsonb?: Json
          p_ip_address?: unknown
          p_target_id?: string
          p_target_table?: string
        }
        Returns: Json
      }
      log_market_movement_activity: {
        Args: {
          p_data: Json
          p_market_id: string
          p_movement_type: string
          p_user_id: string
        }
        Returns: string
      }
      log_trader_activity: {
        Args: { p_activity_type: string; p_data: Json; p_trader_id: string }
        Returns: undefined
      }
      log_workflow_step: {
        Args: {
          p_error_details?: string
          p_execution_id: string
          p_step_data?: Json
          p_step_name: string
          p_step_status: string
        }
        Returns: string
      }
      manual_resolve_market: {
        Args: {
          p_admin_id: string
          p_market_id: string
          p_resolution_notes?: string
          p_winning_outcome: string
        }
        Returns: boolean
      }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[] }
        Returns: Json
      }
      match_order: {
        Args: { p_order_id: string }
        Returns: {
          matched: boolean
          remaining_quantity: number
          trades_created: number
        }[]
      }
      migrate_binary_market_outcomes: { Args: never; Returns: undefined }
      place_atomic_order: {
        Args: {
          p_market_id: string
          p_order_type?: Database["public"]["Enums"]["order_type"]
          p_outcome: Database["public"]["Enums"]["outcome_type"]
          p_price: number
          p_quantity: number
          p_side: Database["public"]["Enums"]["order_side"]
        }
        Returns: string
      }
      place_order_atomic:
        | {
            Args: {
              p_idempotency_key?: string
              p_market_id: string
              p_order_type?: string
              p_outcome: string
              p_price: number
              p_quantity: number
              p_side: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_market_id: string
              p_order_type?: string
              p_price: number
              p_side: string
              p_size: number
              p_user_id: string
            }
            Returns: Json
          }
      place_order_atomic_v2:
        | {
            Args: {
              p_market_id: string
              p_price: number
              p_quantity: number
              p_side: Database["public"]["Enums"]["order_side"]
              p_type: Database["public"]["Enums"]["order_type"]
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_client_id?: string
              p_market_id: string
              p_outcome?: Database["public"]["Enums"]["outcome_type"]
              p_post_only?: boolean
              p_price: number
              p_quantity: number
              p_side: Database["public"]["Enums"]["order_side"]
              p_stop_price?: number
              p_tif?: string
              p_type: Database["public"]["Enums"]["order_type"]
              p_user_id: string
            }
            Returns: Json
          }
      populate_analytics_last_24h: { Args: never; Returns: undefined }
      process_aon_order: {
        Args: {
          p_market_id: string
          p_order_id: string
          p_price: number
          p_side: string
          p_size: number
        }
        Returns: {
          can_proceed: boolean
          message: string
        }[]
      }
      process_deposit_tx: {
        Args: { p_amount: number; p_txid: string; p_user_id: string }
        Returns: boolean
      }
      process_expert_vote: {
        Args: {
          p_confidence_level: number
          p_event_id: string
          p_expert_id: string
          p_reasoning: string
          p_vote_outcome: number
        }
        Returns: string
      }
      process_fok_order: {
        Args: {
          p_market_id: string
          p_order_id: string
          p_price: number
          p_side: string
          p_size: number
        }
        Returns: {
          fills: Json
          message: string
          success: boolean
        }[]
      }
      process_ioc_order: {
        Args: { p_order_id: string; p_size: number }
        Returns: {
          avg_price: number
          cancelled: boolean
          filled_quantity: number
          remaining_quantity: number
        }[]
      }
      process_order_with_tif: {
        Args: {
          p_gtd_expiry?: string
          p_market_id: string
          p_order_type?: string
          p_price: number
          p_side: string
          p_size: number
          p_tif?: Database["public"]["Enums"]["tif_type"]
          p_time_in_force?: string
          p_user_id: string
        }
        Returns: {
          message: string
          order_id: string
          status: string
        }[]
      }
      process_rebate_payment: {
        Args: { p_rebate_id: string; p_tx_hash: string }
        Returns: Json
      }
      process_trade_settlement: {
        Args: {
          p_buy_order_id: string
          p_price: number
          p_quantity: number
          p_sell_order_id: string
        }
        Returns: undefined
      }
      process_withdrawal: {
        Args: { p_withdrawal_id: string }
        Returns: boolean
      }
      re_enter_gtc_order: {
        Args: { p_new_price: number; p_order_id: string }
        Returns: {
          message: string
          new_order_id: string
          preserved_priority: boolean
        }[]
      }
      reconcile_order_state: {
        Args: { p_client_last_sequence?: number; p_order_ids: string[] }
        Returns: {
          cancelled_quantity: number
          changes_since_sequence: Json
          current_status: string
          filled_quantity: number
          order_id: string
          sequence_number: number
        }[]
      }
      record_fill: {
        Args: {
          p_counterparty_order_id: string
          p_counterparty_user_id: string
          p_is_maker?: boolean
          p_order_id: string
          p_price: number
          p_quantity: number
          p_trade_id: string
          p_transaction_hash?: string
        }
        Returns: {
          fill_id: string
          new_avg_price: number
        }[]
      }
      record_liquidity_deposit: {
        Args: { p_amount: number; p_draft_id: string; p_tx_hash: string }
        Returns: boolean
      }
      record_market_deployment: {
        Args: {
          p_deployment_config?: Json
          p_draft_id: string
          p_market_id: string
          p_tx_hash: string
        }
        Returns: boolean
      }
      record_price_snapshots: { Args: never; Returns: undefined }
      record_trade_result_v2: {
        Args: { p_is_win: boolean; p_pnl: number; p_user_id: string }
        Returns: Json
      }
      record_workflow_complete: {
        Args: {
          p_error_message?: string
          p_execution_time_ms?: number
          p_result?: Json
          p_status: string
          p_workflow_run_id: string
        }
        Returns: undefined
      }
      record_workflow_start: {
        Args: {
          p_event_id?: string
          p_market_id?: string
          p_message_id?: string
          p_payload?: Json
          p_workflow_run_id: string
          p_workflow_type: string
        }
        Returns: string
      }
      refresh_market_metrics: { Args: never; Returns: undefined }
      refresh_price_ohlc: { Args: never; Returns: undefined }
      reject_ai_topic: {
        Args: { p_admin_id: string; p_reason?: string; p_topic_id: string }
        Returns: undefined
      }
      reject_deposit_v2: {
        Args: { p_deposit_id: string; p_reason?: string }
        Returns: Json
      }
      reject_withdrawal: {
        Args: { p_id: string; p_note: string }
        Returns: undefined
      }
      release_balance_hold: { Args: { p_id: string }; Returns: undefined }
      release_funds_v2: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      request_withdrawal: {
        Args: {
          p_address: string
          p_amount: number
          p_network: string
          p_user_id: string
        }
        Returns: string
      }
      resolve_dispute_v2: {
        Args: {
          p_admin_response: string
          p_dispute_id: string
          p_override_resolution?: string
        }
        Returns: Json
      }
      resolve_market:
        | {
            Args: {
              p_event_id: string
              p_resolver_id: string
              p_winner: number
            }
            Returns: undefined
          }
        | { Args: { p_market_id: string; p_resolution: string }; Returns: Json }
      resolve_market_v2: {
        Args: { p_data: Json; p_market_id: string }
        Returns: Json
      }
      respond_to_follow_request: {
        Args: { p_approve: boolean; p_request_id: string; p_target_id: string }
        Returns: Json
      }
      review_kyc_document: {
        Args: {
          p_admin_id: string
          p_document_id: string
          p_reason?: string
          p_status: string
        }
        Returns: boolean
      }
      search_users: {
        Args: {
          p_kyc_filter?: string
          p_limit?: number
          p_offset?: number
          p_query: string
          p_status_filter?: string
        }
        Returns: {
          account_status: string
          created_at: string
          email: string
          full_name: string
          id: string
          total_matches: number
          verification_status: string
        }[]
      }
      seed_event_orderbook: {
        Args: {
          p_event_id: string
          p_initial_liquidity?: number
          p_spread?: number
        }
        Returns: undefined
      }
      set_exchange_rate: {
        Args: { new_rate: number; pair: string }
        Returns: undefined
      }
      settle_market:
        | {
            Args: {
              p_market_id: string
              p_outcome: string
              p_resolved_by?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_market_id: string
              p_winning_outcome: Database["public"]["Enums"]["outcome_type"]
            }
            Returns: {
              total_payout: number
              users_settled: number
            }[]
          }
      settle_market_v2:
        | { Args: { p_market_id: string; p_resolution: string }; Returns: Json }
        | {
            Args: {
              p_market_id: string
              p_winning_outcome: Database["public"]["Enums"]["outcome_type"]
            }
            Returns: undefined
          }
      settle_trade_cash: {
        Args: {
          p_amount: number
          p_buyer_id: string
          p_seller_id: string
          p_trade_id?: string
        }
        Returns: undefined
      }
      soft_cancel_order: {
        Args: {
          p_client_request_id?: string
          p_order_id: string
          p_user_id: string
        }
        Returns: {
          cancel_record_id: string
          current_status: string
          message: string
          sequence_number: number
          success: boolean
        }[]
      }
      start_resting_order_tracking: {
        Args: {
          p_market_id: string
          p_order_id: string
          p_price: number
          p_quantity: number
          p_side: string
          p_user_id: string
        }
        Returns: string
      }
      stop_resting_order_tracking: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      submit_deposit_request: {
        Args: {
          p_amount: number
          p_payment_method: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: string
      }
      submit_for_legal_review: {
        Args: { p_draft_id: string; p_submitter_notes?: string }
        Returns: boolean
      }
      submit_oracle_request_v2: {
        Args: { p_market_id: string; p_requested_by?: string }
        Returns: Json
      }
      submit_oracle_verdict_v2: {
        Args: {
          p_confidence: number
          p_evidence?: Json
          p_reasoning: string
          p_request_id: string
          p_resolution: string
        }
        Returns: Json
      }
      submit_order: {
        Args: {
          p_market_id: string
          p_price: number
          p_side: string
          p_size: number
          p_user_id: string
        }
        Returns: Json
      }
      test_event_creation: { Args: never; Returns: Json }
      toggle_bookmark: { Args: { p_market_id: string }; Returns: Json }
      toggle_comment_like: { Args: { p_comment_id: string }; Returns: Json }
      toggle_market_follow: {
        Args: {
          p_market_id: string
          p_notify_on_resolve?: boolean
          p_notify_on_trade?: boolean
        }
        Returns: Json
      }
      track_user_activity: { Args: { p_user_id: string }; Returns: undefined }
      unfollow_market: {
        Args: { p_market_id: string; p_user_id: string }
        Returns: Json
      }
      unfollow_user: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: Json
      }
      unfreeze_funds: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      unlock_wallet_funds: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      update_admin_log_workflow: {
        Args: {
          p_log_id: string
          p_new_values?: Json
          p_workflow_status: string
        }
        Returns: undefined
      }
      update_draft_stage: {
        Args: { p_draft_id: string; p_stage: string; p_stage_data: Json }
        Returns: boolean
      }
      update_event_status: {
        Args: {
          p_admin_id: string
          p_event_id: string
          p_new_status: string
          p_reason?: string
        }
        Returns: Json
      }
      update_exchange_rate: {
        Args: { currency_pair: string; rate: number; recorded_at?: string }
        Returns: undefined
      }
      update_exchange_rate_v2: {
        Args: {
          p_currency_pair: string
          p_rate: number
          p_recorded_at?: string
        }
        Returns: undefined
      }
      update_expert_rank_tier: {
        Args: { p_reputation_score: number }
        Returns: string
      }
      update_leaderboard: {
        Args: { p_score_delta: number; p_user_id: string }
        Returns: Json
      }
      update_leaderboard_v2: {
        Args: { p_score_delta: number; p_user_id: string }
        Returns: Json
      }
      update_maker_volume: {
        Args: {
          p_is_maker: boolean
          p_resting_seconds?: number
          p_spread_contribution?: number
          p_user_id: string
          p_volume: number
        }
        Returns: undefined
      }
      update_position:
        | {
            Args: {
              p_market_id: string
              p_outcome: Database["public"]["Enums"]["outcome_type"]
              p_price: number
              p_quantity: number
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_market_id: string
              p_outcome: Database["public"]["Enums"]["outcome_type"]
              p_price: number
              p_quantity_delta: number
              p_user_id: string
            }
            Returns: undefined
          }
      update_price_changes: { Args: never; Returns: undefined }
      update_user_status: {
        Args: { p_admin_id: string; p_status: string; p_user_id: string }
        Returns: boolean
      }
      update_workflow_status: {
        Args: {
          p_error_message?: string
          p_execution_id: string
          p_increment_retry?: boolean
          p_status: string
        }
        Returns: boolean
      }
      upsert_position_v2: {
        Args: {
          p_market_id: string
          p_outcome: Database["public"]["Enums"]["outcome_type"]
          p_price: number
          p_quantity: number
          p_side: string
          p_user_id: string
        }
        Returns: undefined
      }
      verify_and_credit_deposit: {
        Args: { p_admin_id: string; p_deposit_id: string }
        Returns: boolean
      }
      verify_and_credit_deposit_v2: {
        Args: { p_admin_notes?: string; p_deposit_id: string }
        Returns: Json
      }
      verify_expert_vote: {
        Args: {
          p_ai_feedback: string
          p_ai_relevance_score: number
          p_final_outcome: number
          p_vote_id: string
        }
        Returns: undefined
      }
      withdraw_funds_v2: {
        Args: {
          p_amount: number
          p_destination?: string
          p_method?: string
          p_user_id: string
        }
        Returns: Json
      }
      withdrawal_processing: {
        Args: { p_withdrawal_id: string }
        Returns: boolean
      }
      workflow_health_check: {
        Args: never
        Returns: {
          check_name: string
          details: string
          severity: string
          status: string
        }[]
      }
    }
    Enums: {
      accuracy_tier:
        | "novice"
        | "apprentice"
        | "analyst"
        | "expert"
        | "master"
        | "oracle"
      activity_type:
        | "TRADE"
        | "MARKET_CREATE"
        | "MARKET_RESOLVE"
        | "LEAGUE_UP"
        | "LEAGUE_DOWN"
        | "COMMENT"
        | "USER_JOIN"
      answer_type: "binary" | "categorical" | "scalar"
      attachment_type: "image" | "link" | "gif" | "file"
      badge_category:
        | "accuracy"
        | "volume"
        | "streak"
        | "community"
        | "special"
        | "expert"
      badge_rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
      content_type:
        | "market_movement"
        | "trader_activity"
        | "system_notification"
        | "social_interaction"
        | "trending_market"
        | "comment_reply"
        | "mention"
        | "follow"
        | "badge_earned"
        | "market_resolve"
      deposit_status:
        | "pending"
        | "under_review"
        | "verified"
        | "rejected"
        | "auto_approved"
        | "completed"
      flag_reason:
        | "spam"
        | "harassment"
        | "hate_speech"
        | "misinformation"
        | "off_topic"
        | "trolling"
        | "other"
      kyc_status:
        | "not_started"
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
      market_status:
        | "active"
        | "closed"
        | "resolved"
        | "cancelled"
        | "draft"
        | "paused"
        | "rejected"
      market_type_enum: "binary" | "multi_outcome" | "scalar"
      mfs_provider: "bkash" | "nagad" | "rocket" | "upay"
      moderation_status:
        | "clean"
        | "pending_review"
        | "flagged"
        | "removed"
        | "appealed"
      notification_type:
        | "market_resolved"
        | "trade_filled"
        | "price_alert"
        | "market_closing_soon"
        | "follower_trade"
        | "ai_suggestion"
        | "position_profit"
        | "position_loss"
        | "system"
        | "order_filled"
      oracle_status: "pending" | "verified" | "disputed" | "finalized"
      order_side: "buy" | "sell"
      order_status:
        | "open"
        | "partially_filled"
        | "filled"
        | "cancelled"
        | "expired"
      order_type:
        | "limit"
        | "market"
        | "stop_loss"
        | "take_profit"
        | "trailing_stop"
        | "iceberg"
      outcome_type: "YES" | "NO"
      payment_method: "bkash" | "nagad" | "bank_transfer"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      sentiment_type: "positive" | "negative" | "neutral" | "mixed"
      tif_type: "FOK" | "IOC" | "GTC" | "GTD" | "AON"
      trading_phase_type:
        | "PRE_OPEN"
        | "CONTINUOUS"
        | "AUCTION"
        | "HALTED"
        | "CLOSED"
      transaction_status: "pending" | "completed" | "failed" | "reversed"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "trade_buy"
        | "trade_sell"
        | "settlement"
        | "refund"
      user_account_status: "active" | "restricted" | "dormant" | "banned"
      vote_type: "upvote" | "downvote" | "none"
      withdrawal_status:
        | "pending"
        | "processing"
        | "completed"
        | "rejected"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accuracy_tier: [
        "novice",
        "apprentice",
        "analyst",
        "expert",
        "master",
        "oracle",
      ],
      activity_type: [
        "TRADE",
        "MARKET_CREATE",
        "MARKET_RESOLVE",
        "LEAGUE_UP",
        "LEAGUE_DOWN",
        "COMMENT",
        "USER_JOIN",
      ],
      answer_type: ["binary", "categorical", "scalar"],
      attachment_type: ["image", "link", "gif", "file"],
      badge_category: [
        "accuracy",
        "volume",
        "streak",
        "community",
        "special",
        "expert",
      ],
      badge_rarity: ["common", "uncommon", "rare", "epic", "legendary"],
      content_type: [
        "market_movement",
        "trader_activity",
        "system_notification",
        "social_interaction",
        "trending_market",
        "comment_reply",
        "mention",
        "follow",
        "badge_earned",
        "market_resolve",
      ],
      deposit_status: [
        "pending",
        "under_review",
        "verified",
        "rejected",
        "auto_approved",
        "completed",
      ],
      flag_reason: [
        "spam",
        "harassment",
        "hate_speech",
        "misinformation",
        "off_topic",
        "trolling",
        "other",
      ],
      kyc_status: ["not_started", "pending", "approved", "rejected", "expired"],
      market_status: [
        "active",
        "closed",
        "resolved",
        "cancelled",
        "draft",
        "paused",
        "rejected",
      ],
      market_type_enum: ["binary", "multi_outcome", "scalar"],
      mfs_provider: ["bkash", "nagad", "rocket", "upay"],
      moderation_status: [
        "clean",
        "pending_review",
        "flagged",
        "removed",
        "appealed",
      ],
      notification_type: [
        "market_resolved",
        "trade_filled",
        "price_alert",
        "market_closing_soon",
        "follower_trade",
        "ai_suggestion",
        "position_profit",
        "position_loss",
        "system",
        "order_filled",
      ],
      oracle_status: ["pending", "verified", "disputed", "finalized"],
      order_side: ["buy", "sell"],
      order_status: [
        "open",
        "partially_filled",
        "filled",
        "cancelled",
        "expired",
      ],
      order_type: [
        "limit",
        "market",
        "stop_loss",
        "take_profit",
        "trailing_stop",
        "iceberg",
      ],
      outcome_type: ["YES", "NO"],
      payment_method: ["bkash", "nagad", "bank_transfer"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      sentiment_type: ["positive", "negative", "neutral", "mixed"],
      tif_type: ["FOK", "IOC", "GTC", "GTD", "AON"],
      trading_phase_type: [
        "PRE_OPEN",
        "CONTINUOUS",
        "AUCTION",
        "HALTED",
        "CLOSED",
      ],
      transaction_status: ["pending", "completed", "failed", "reversed"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "trade_buy",
        "trade_sell",
        "settlement",
        "refund",
      ],
      user_account_status: ["active", "restricted", "dormant", "banned"],
      vote_type: ["upvote", "downvote", "none"],
      withdrawal_status: [
        "pending",
        "processing",
        "completed",
        "rejected",
        "cancelled",
      ],
    },
  },
} as const
