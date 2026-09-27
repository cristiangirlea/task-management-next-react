import { ListSkeleton } from './SettingsCard';

export default function SettingsSkeleton() {
    return (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading settings">
            <div className="skeleton h-8 w-40" />
            {[0, 1, 2, 3].map((card) => (
                <div key={card} className="card bg-base-100 shadow-sm">
                    <div className="card-body gap-3 p-4 sm:p-6">
                        <div className="skeleton h-6 w-32" />
                        <ListSkeleton rows={2} />
                    </div>
                </div>
            ))}
        </div>
    );
}
