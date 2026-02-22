import { ImageSourcePropType } from 'react-native';

type TribeImageSet = {
  background: ImageSourcePropType;
  hero: ImageSourcePropType | null;
  header: ImageSourcePropType | null;
  thumb: ImageSourcePropType | null;
};

type TribeImageMap = Record<string, TribeImageSet>;

const missingImage: ImageSourcePropType | null = null;

const tribeImages: TribeImageMap = {
  '1': {
    background: require('../../assets/Tribes/1. Reuben/Reuben_background_9x16.png'),
    hero: require('../../assets/Tribes/1. Reuben/reuben_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/1. Reuben/reuben_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/1. Reuben/reuben_thumb_1x1_512.png'),
  },
  '2': {
    background: require('../../assets/Tribes/2. Simeon/Simeon_background_9x16.png'),
    hero: require('../../assets/Tribes/2. Simeon/simeon_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/2. Simeon/simeon_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/2. Simeon/simeon_thumb_1x1_512.png'),
  },
  '3': {
    background: require('../../assets/Tribes/3. Levi/Levi_background_9x16.png'),
    hero: require('../../assets/Tribes/3. Levi/levi_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/3. Levi/levi_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/3. Levi/levi_thumb_1x1_512.png'),
  },
  '4': {
    background: require('../../assets/Tribes/4. Judah/Judah_background_9x16.png'),
    hero: require('../../assets/Tribes/4. Judah/judah_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/4. Judah/judah_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/4. Judah/judah_thumb_1x1_512.png'),
  },
  '5': {
    background: require('../../assets/Tribes/5. Dan/Dan_background_9x16.png'),
    hero: require('../../assets/Tribes/5. Dan/dan_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/5. Dan/dan_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/5. Dan/dan_thumb_1x1_512.png'),
  },
  '6': {
    background: require('../../assets/Tribes/6. Naphtali/Naphtali_background_9x16.png'),
    hero: require('../../assets/Tribes/6. Naphtali/naphtali_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/6. Naphtali/naphtali_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/6. Naphtali/naphtali_thumb_1x1_512.png'),
  },
  '7': {
    background: require('../../assets/Tribes/7. Gad/Gad_background_9x16.png'),
    hero: require('../../assets/Tribes/7. Gad/gad_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/7. Gad/gad_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/7. Gad/gad_thumb_1x1_512.png'),
  },
  '8': {
    background: require('../../assets/Tribes/8. Asher/Asher_background_9x16.png'),
    hero: require('../../assets/Tribes/8. Asher/asher_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/8. Asher/asher_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/8. Asher/asher_thumb_1x1_512.png'),
  },
  '9': {
    background: require('../../assets/Tribes/9. Issachar/Issachar_background_9x16.png'),
    hero: require('../../assets/Tribes/9. Issachar/issachar_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/9. Issachar/issachar_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/9. Issachar/issachar_thumb_1x1_512.png'),
  },
  '10': {
    background: require('../../assets/Tribes/10. Zebulun/Zebulun_background_9x16.png'),
    hero: require('../../assets/Tribes/10. Zebulun/zebulun_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/10. Zebulun/zebulun_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/10. Zebulun/zebulun_thumb_1x1_512.png'),
  },
  '11': {
    background: require('../../assets/Tribes/11. Joseph/Joseph_background_9x16.png'),
    hero: require('../../assets/Tribes/11. Joseph/joseph_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/11. Joseph/joseph_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/11. Joseph/joseph_thumb_1x1_512.png'),
  },
  '12': {
    background: require('../../assets/Tribes/12. Benjamin/Benjamin_background_9x16.png'),
    hero: require('../../assets/Tribes/12. Benjamin/benjamin_hero_16x9_1920x1080.png'),
    header: require('../../assets/Tribes/12. Benjamin/benjamin_header_4x3_1600x1200.png'),
    thumb: require('../../assets/Tribes/12. Benjamin/benjamin_thumb_1x1_512.png'),
  },
};

export default tribeImages;
