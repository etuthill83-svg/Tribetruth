import { View } from 'react-native';

type Props = {
  size: number;
};

export default function Spacer({ size }: Props) {
  return <View style={{ height: size }} />;
}
