import { createClient } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = createClient()
  const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">설정</h1>
      <SettingsForm
        initial={{
          targetCo2Kg: Number(s?.target_co2_kg ?? 5),
          challengeStart: s?.challenge_start ?? '',
          challengeEnd: s?.challenge_end ?? '',
          carEmission: Number(s?.car_emission ?? 210),
          walkEmission: Number(s?.walk_emission ?? 0),
          bikeEmission: Number(s?.bike_emission ?? 0),
          busEmission: Number(s?.bus_emission ?? 27.7),
          subwayEmission: Number(s?.subway_emission ?? 1.53),
        }}
      />
    </div>
  )
}
