import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const locale = cookies().get('locale')?.value ?? 'de'
  const validLocales = ['de', 'en']
  const safeLocale = validLocales.includes(locale) ? locale : 'de'

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  }
})
