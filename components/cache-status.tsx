'use client'

import { useState } from 'react'
import { useCacheInfo, useClearCache } from '@/hooks/use-cached-data'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Database, Trash2, HardDrive, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/i18n'

export function CacheStatus() {
  const { data: cacheInfo } = useCacheInfo()
  const { mutate: clearCache, isPending: isClearing } = useClearCache()
  const [showDialog, setShowDialog] = useState(false)
  const { t, i18n }=useTranslation('translation');
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const totalSize = (cacheInfo?.localStorageSize || 0) + (cacheInfo?.indexedDBSize || 0)
  const maxSize = 10 * 1024 * 1024 // 10MB max for demo
  const usagePercent = Math.min((totalSize / maxSize) * 100, 100)

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t('cacheStatus.title')}</h3>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('cacheStatus.offlineCache.title')}</DialogTitle>
              <DialogDescription className="space-y-2 pt-2">
                {(t('cacheStatus.offlineCache.description', { returnObjects: true }) as string[]).map((desc, i) => (
                  <p key={i}>{desc}</p>
                ))}
                <ul className="list-disc pl-5 space-y-1">
                  {(t('cacheStatus.offlineCache.list', { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="pt-2">
                  {t('cacheStatus.offlineCache.note')}
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('cacheStatus.cacheUsage')}</span>
          <span>{formatBytes(totalSize)} / {formatBytes(maxSize)}</span>
        </div>
        <Progress value={usagePercent} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <HardDrive className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{t('cacheStatus.local')}</span>
          <span className="font-medium">{formatBytes(cacheInfo?.localStorageSize || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{t('cacheStatus.indexedDB')}</span>
          <span className="font-medium">{formatBytes(cacheInfo?.indexedDBSize || 0)}</span>
        </div>
      </div>

      <div className="pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatNumber(cacheInfo?.totalItems || 0, i18n.language)}  {t('cacheStatus.cachedItems')}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={isClearing}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t('cacheStatus.clearChaceButton')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('cacheStatus.clearCache.title')}</DialogTitle>
                <DialogDescription>
                  {t('cacheStatus.clearCache.description')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  {t('cacheStatus.clearCache.cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    clearCache()
                    setShowDialog(false)
                  }}
                >
                  {t('cacheStatus.clearCache.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!navigator.onLine && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
            <span>{t('cacheStatus.offlineMode')}</span>
          </div>
        </div>
      )}
    </Card>
  )
}
