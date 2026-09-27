import AuthCard from './AuthCard';

/** Placeholder for a card that reads the query string, shown while it hydrates. */
export default function AuthCardSkeleton({ title, rows = 2 }: { title: string; rows?: number }) {
    return (
        <AuthCard title={title} footer={<span className="skeleton inline-block h-4 w-24 align-middle" />}>
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
                {Array.from({ length: rows }, (_, i) => (
                    <div key={i} className="skeleton h-12 w-full" />
                ))}
            </div>
        </AuthCard>
    );
}
