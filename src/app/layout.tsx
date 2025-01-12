import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
    title: "Task Management Kanban Board",
    description: "A project management tool built with Tailwind and DaisyUI",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-base-100 text-base-content min-h-screen">
                <main className="container mx-auto p-6">{children}</main>
            </body>
        </html>
    );
}
