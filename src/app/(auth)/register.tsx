import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import React from "react";


export default function Register() {

  const [showPassword, setShowPassword] = React.useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };
  

  return (
    <VStack space="xs" className="flex-1 justify-center px-6 bg-black">
      <Text className="text-white text-3xl font-bold mb-6">
        Kayıt Ol
      </Text>
      <Input variant="rounded" className="mb-4 bg-zinc-900 border border-zinc-700">
        <InputField
          placeholder="İsim"
          className="text-white"
        />
      </Input>
      <Input variant="rounded" className="mb-4 bg-zinc-900 border border-zinc-700">
        <InputField
          placeholder="Soyisim"
          className="text-white"
        />
      </Input>
      <Input variant="rounded" className="mb-4 bg-zinc-900 border border-zinc-700">
        <InputField
          inputMode="numeric"
          keyboardType="number-pad"
          placeholder="Telefon"
          className="text-white"
        />
      </Input>

      <Input variant="rounded" className="mb-4 bg-zinc-900 border border-zinc-700">
        <InputField
          placeholder="Email"
          className="text-white"
        />
      </Input>

      <Input variant="rounded" className="mb-6 bg-zinc-900 border border-zinc-700">
        <InputField
          placeholder="Password"
          secureTextEntry
          className="text-white"
          type={showPassword ? 'text' : 'password'}
        />
        <InputSlot  className="pr-3" onPress={handleState}>
          <InputIcon as={showPassword ? EyeIcon : EyeOffIcon}/>
        </InputSlot>
      </Input>

      <Button variant="outline" className="rounded-2xl" >
        <Text className="text-white font-semibold">Login</Text>
      </Button>
    </VStack>
  );
}
