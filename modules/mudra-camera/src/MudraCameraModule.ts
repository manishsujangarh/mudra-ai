import { NativeModule, requireNativeModule } from 'expo';

declare class MudraCameraModule extends NativeModule<{}> {}

export default requireNativeModule<MudraCameraModule>('MudraCamera');
