import { SettingsRepository } from '@/lib/repositories/repositories'

export const SettingsService = {
  getSettings: async (tenantId: string): Promise<any> => {
    return SettingsRepository.getSettings(tenantId)
  },

  saveSettings: async (tenantId: string, updates: any): Promise<any> => {
    return SettingsRepository.saveSettings(tenantId, updates)
  },

  resetTable: async (tenantId: string, section: string): Promise<void> => {
    return SettingsRepository.resetTable(tenantId, section)
  }
}
