"use client";

import { usePathname } from "next/navigation";

const Navbar = () => {
    const pathname = usePathname();

    const navItems = [
        { name: "Tasks", href: "/tasks" },
        { name: "About", href: "/about" },
        { name: "Profile", href: "/profile" },
    ];

    return (
        <div className="navbar bg-base-100 shadow-md sticky top-0 z-10">
            <div className="flex-1">
                <a
                    href="/"
                    className="text-xl font-bold tracking-wide text-primary"
                >
                    <span className="text-purple-500">Task</span>{" "}
                    <span className="text-pink-500">Manager</span>
                </a>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1 space-x-4">
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <a
                                href={item.href}
                                className={`${
                                    pathname === item.href
                                        ? "text-primary border-b-2 border-primary"
                                        : "hover:text-primary"
                                }`}
                            >
                                {item.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Separator */}
            <div className="w-full h-px bg-gray-200 mt-2"></div>
        </div>
    );
};

export default Navbar;
