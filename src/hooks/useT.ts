import { useLanguage } from "@/contexts/LanguageContext";

export function useT() {
  const { t } = useLanguage();
  return t;
}
