import { settingModels } from './seeds/setting.seed-model';

declare global {
  interface Settings extends SettingTree<typeof settingModels> {}
}
