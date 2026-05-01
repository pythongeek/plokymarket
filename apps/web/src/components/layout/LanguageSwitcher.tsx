'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { localeLabels, type Locale } from '@/i18n/config';

const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'bn', label: 'বাংলা', flag: 'BD' },
    { code: 'en', label: 'English', flag: 'US' },
    { code: 'hi', label: 'हिन्दी', flag: 'IN' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const changeLanguage = (code: Locale) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
        // Force a re-render by refreshing the page to pick up new locale
        // This ensures server-side translations are also updated
        router.refresh();
    };

    return (
        <div ref={dropdownRef} className="relative">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                        <Languages className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm font-medium">
                            {currentLang.label}
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className="flex items-center justify-between cursor-pointer hover:bg-accent"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base">{lang.flag === 'BD' ? '🇧🇩' : lang.flag === 'US' ? '🇺🇸' : '🇮🇳'}</span>
                                <span className="font-medium">{lang.label}</span>
                            </div>
                            {i18n.language === lang.code && (
                                <Check className="h-4 w-4 text-primary" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// Mobile-only compact version for the mobile header
export function MobileLanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const cycleLanguage = () => {
        const currentIndex = languages.findIndex((l) => l.code === i18n.language);
        const nextIndex = (currentIndex + 1) % languages.length;
        i18n.changeLanguage(languages[nextIndex].code);
    };

    const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

    return (
        <div ref={dropdownRef} className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={cycleLanguage}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title={`Language: ${currentLang.label}`}
            >
                <Languages className="h-5 w-5" />
            </Button>
        </div>
    );
}
