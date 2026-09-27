import type { Metadata } from 'next';
import RequireAuth from '@/components/RequireAuth';
import SettingsPage from '@/components/settings/SettingsPage';
import SettingsSkeleton from '@/components/settings/SettingsSkeleton';

export const metadata: Metadata = { title: 'Settings · Task Board' };

export default function Page() {
    return (
        <RequireAuth fallback={<SettingsSkeleton />}>
            <SettingsPage />
        </RequireAuth>
    );
}
