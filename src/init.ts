import { replace } from './index';
import { HookScope } from './types/common';

replace(HookScope.Console);
replace(HookScope.Api);
replace(HookScope.App);
replace(HookScope.Page);
replace(HookScope.Component);
