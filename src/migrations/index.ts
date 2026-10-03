import * as migration_20260819_174526_initial from './20260819_174526_initial';
import * as migration_20260915_153519_hosted_media_and_policies from './20260915_153519_hosted_media_and_policies';

export const migrations = [
  {
    up: migration_20260819_174526_initial.up,
    down: migration_20260819_174526_initial.down,
    name: '20260819_174526_initial',
  },
  {
    up: migration_20260915_153519_hosted_media_and_policies.up,
    down: migration_20260915_153519_hosted_media_and_policies.down,
    name: '20260915_153519_hosted_media_and_policies'
  },
];
