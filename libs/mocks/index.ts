import { ccmHandlers } from './ccm.handlers';
import { findingsHandlers } from './findings.handlers';
import { meHandlers } from './me.handlers';
import { missionsHandlers } from './missions.handlers';
import { tasksHandlers } from './tasks.handlers';

/** Tous les handlers MSW de la Plateforme Fonctionnelle (un groupe par fichier de contrat). */
export const handlers = [...meHandlers, ...missionsHandlers, ...findingsHandlers, ...ccmHandlers, ...tasksHandlers];

export * from './ccm.handlers';
export * from './findings.handlers';
export * from './me.handlers';
export * from './missions.handlers';
export * from './tasks.handlers';
