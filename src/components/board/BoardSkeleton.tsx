export default function BoardSkeleton() {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4" aria-busy="true" aria-label="Loading board">
            {[0, 1, 2].map((column) => (
                <div
                    key={column}
                    className="flex w-72 shrink-0 flex-col gap-3 rounded-box bg-base-100 p-4 shadow-sm sm:w-80"
                >
                    <div className="skeleton h-5 w-24" />
                    {[0, 1, 2].map((card) => (
                        <div key={card} className="skeleton h-16 w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}
