import type { Metadata } from 'next';
import InvitePage from '@/components/invite/InvitePage';

export const metadata: Metadata = { title: 'Join workspace · Task Board' };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    return <InvitePage token={token} />;
}
