import RequireAuth from '@/components/RequireAuth';
import BoardPage from '@/components/board/BoardPage';
import BoardSkeleton from '@/components/board/BoardSkeleton';

export default function HomePage() {
    return (
        <RequireAuth fallback={<BoardSkeleton />}>
            <BoardPage />
        </RequireAuth>
    );
}
