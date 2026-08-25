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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          device_id: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          device_id: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          device_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          battery_percentage: number | null
          created_at: string
          id: string
          imei: string
          jamming_status: boolean | null
          last_seen: string | null
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["device_status"] | null
          tamper_status: boolean | null
          updated_at: string
        }
        Insert: {
          battery_percentage?: number | null
          created_at?: string
          id?: string
          imei: string
          jamming_status?: boolean | null
          last_seen?: string | null
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["device_status"] | null
          tamper_status?: boolean | null
          updated_at?: string
        }
        Update: {
          battery_percentage?: number | null
          created_at?: string
          id?: string
          imei?: string
          jamming_status?: boolean | null
          last_seen?: string | null
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["device_status"] | null
          tamper_status?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      geofences: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          on_enter: string | null
          on_exit: string | null
          owner_id: string
          polygon: Json
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          on_enter?: string | null
          on_exit?: string | null
          owner_id: string
          polygon: Json
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          on_enter?: string | null
          on_exit?: string | null
          owner_id?: string
          polygon?: Json
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          created_at: string
          device_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          device_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          timestamp?: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          device_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          anomaly_score: number | null
          created_at: string
          device_id: string
          frequency: number | null
          id: string
          route_summary: Json | null
          time_range: unknown | null
          updated_at: string
          weekday: number | null
        }
        Insert: {
          anomaly_score?: number | null
          created_at?: string
          device_id: string
          frequency?: number | null
          id?: string
          route_summary?: Json | null
          time_range?: unknown | null
          updated_at?: string
          weekday?: number | null
        }
        Update: {
          anomaly_score?: number | null
          created_at?: string
          device_id?: string
          frequency?: number | null
          id?: string
          route_summary?: Json | null
          time_range?: unknown | null
          updated_at?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patterns_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_type:
        | "theft"
        | "geofence"
        | "jamming"
        | "tamper"
        | "anomaly"
        | "battery_low"
        | "sos"
      device_status: "online" | "offline" | "maintenance"
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
      alert_severity: ["low", "medium", "high", "critical"],
      alert_type: [
        "theft",
        "geofence",
        "jamming",
        "tamper",
        "anomaly",
        "battery_low",
        "sos",
      ],
      device_status: ["online", "offline", "maintenance"],
    },
  },
} as const
