import { ImageSourcePropType } from 'react-native';

const fallbackBackground = require('../../assets/splash-icon.png');

const tribeBackgrounds: Record<string, ImageSourcePropType> = {
  '1': require('../../assets/Tribes/1. Reuben/Reuben_background_9x16.png'),
  '2': require('../../assets/Tribes/2. Simeon/Simeon_background_9x16.png'),
  '3': require('../../assets/Tribes/3. Levi/Levi_background_9x16.png'),
  '4': require('../../assets/Tribes/4. Judah/Judah_background_9x16.png'),
  '5': require('../../assets/Tribes/5. Dan/Dan_background_9x16.png'),
  '6': require('../../assets/Tribes/6. Naphtali/Naphtali_background_9x16.png'),
  '7': require('../../assets/Tribes/7. Gad/Gad_background_9x16.png'),
  '8': require('../../assets/Tribes/8. Asher/Asher_background_9x16.png'),
  '9': require('../../assets/Tribes/9. Issachar/Issachar_background_9x16.png'),
  '10': require('../../assets/Tribes/10. Zebulun/Zebulun_background_9x16.png'),
  '11': require('../../assets/Tribes/11. Joseph/Joseph_background_9x16.png'),
  '12': require('../../assets/Tribes/12. Benjamin/Benjamin_background_9x16.png'),
  fallback: fallbackBackground,
};

export default tribeBackgrounds;
