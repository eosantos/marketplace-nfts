import { http } from 'msw'
import { respond } from '../http/respond'
import { listArticles } from '../services/articles'
import { publicRoute } from './helpers'

export const articleHandlers = [http.get('/api/articles', publicRoute(() => respond(listArticles())))]
