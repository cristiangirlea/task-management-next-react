import type { Metadata } from 'next';
import InvitePage from '@/components/invite/InvitePage';

export const metadata: Metadata = { title: 'Join workspace · Task Board' };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    // Keyed so that another invitation starts from a blank page.
    return <InvitePage key={token} token={token} />;
}
