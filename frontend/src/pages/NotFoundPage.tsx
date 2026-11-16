import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../components/Button'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="text-center py-16">
      <div className="text-7xl mb-3" aria-hidden="true">🌾</div>
      <h1 className="text-3xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500 mt-2 mb-6">{t('errors.notFound')}</p>
      <Link to="/">
        <Button>{t('errors.backHome')}</Button>
      </Link>
    </div>
  )
}
