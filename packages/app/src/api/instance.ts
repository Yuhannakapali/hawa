import { apiBaseUrl } from '../config';
import { createApiClient } from './client';

export const api = createApiClient(apiBaseUrl());
