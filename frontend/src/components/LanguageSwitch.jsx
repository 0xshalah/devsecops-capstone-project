import { usePrefs } from "@/preferences/PreferencesContext";
import { LANGS } from "@/i18n/dictionary";

export const LanguageSwitch = ({ testId = "nav-language-switch" }) => {
  const { lang, setLang, t } = usePrefs();
  return (
    <div role="radiogroup" aria-label={t("lang.label")} data-testid={testId} className="inline-flex h-8 items-center rounded-[5px] border border-[var(--line)] p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          role="radio"
          aria-checked={lang === l.value}
          aria-label={l.name}
          title={l.name}
          data-testid={`${testId}-${l.value}`}
          onClick={() => setLang(l.value)}
          className={`h-full rounded-[3px] px-2 font-mono text-[11px] tracking-wider transition-colors duration-150 ${lang === l.value ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
};
