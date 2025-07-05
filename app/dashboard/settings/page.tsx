import { supabase } from "@/lib/supabase";
import Cookies from "js-cookie";

export default function SettingsPage() {
  const userId = Cookies.get("user_id");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and settings</p>
      </div>

      <div className="text-center py-12">
        <p className="text-gray-500">Settings page coming soon...</p>
      </div>
    </div>
  )
}
