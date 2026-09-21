import type { ReactNode } from 'react';

type Props = { title: string; children: ReactNode; footer: ReactNode };

export default function AuthCard({ title, children, footer }: Props) {
    return (
        <div className="mx-auto mt-6 w-full max-w-md sm:mt-12">
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h1 className="card-title text-2xl">{title}</h1>
                    {children}
                    <p className="mt-2 text-center text-sm text-base-content/70">{footer}</p>
                </div>
            </div>
        </div>
    );
}
