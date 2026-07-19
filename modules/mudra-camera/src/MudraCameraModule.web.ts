import { registerWebModule, NativeModule } from 'expo';

class MudraCameraModule extends NativeModule<{}> {}

export default registerWebModule(MudraCameraModule, 'MudraCameraModule');
