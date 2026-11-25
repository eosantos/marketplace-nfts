import type { Article } from '@/shared/contracts'
import { articleFixtures } from '../fixtures'
import { ok, type ServiceResult } from '../http/result'

export function listArticles(): ServiceResult<Article[]> {
  return ok(structuredClone(articleFixtures))
}
