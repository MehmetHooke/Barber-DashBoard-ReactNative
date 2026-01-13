import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from "expo-router";


export default function Login() {
  return (
    <VStack className="flex-1 justify-center px-6 bg-black">
      <Text className="text-white text-3xl font-bold mb-6">
        Welcome Back
      </Text>

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
        />
      </Input>

      <Button variant="outline" className="rounded-2xl mb-10" >
        <Text className="text-white font-semibold">Login</Text>
      </Button>
      <Text>Eğer kayıtlı değilsen</Text>
        <Button variant="outline" onPress={()=> router.push("/(auth)/register")} className=" mt-2 rounded-2xl" >
          <Text className="text-white font-semibold">Kayıt ol</Text>
        </Button>
      
    </VStack>
  );
}
