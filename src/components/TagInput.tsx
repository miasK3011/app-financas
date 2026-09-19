import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Button, Text, XStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';

export type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

/**
 * Tags como chips removíveis + "+ Nova tag" (`.tag-chip`/`.tag-row` em
 * NovaCompra.dc.html) — issue #5, achado #4. Antes era um único
 * `AppInput` de texto "separadas por vírgula".
 */
export function TagInput({ value, onChange }: TagInputProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft('');
    setAdding(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <XStack flexWrap="wrap" gap="$2" alignItems="center">
      {value.map((tag) => (
        <XStack
          key={tag}
          alignItems="center"
          gap="$1"
          backgroundColor="$bg"
          borderColor="$border"
          borderWidth={1}
          borderRadius={999}
          paddingVertical={7}
          paddingLeft={12}
          paddingRight={8}
        >
          <Text fontSize={12.5} fontWeight="600" color="$text">
            {tag}
          </Text>
          <Button
            onPress={() => removeTag(tag)}
            size="$1"
            circular
            chromeless
            padding={0}
            icon={<X size={13} color="#6C6C6D" />}
          />
        </XStack>
      ))}

      {adding ? (
        <AppInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commitDraft}
          onBlur={commitDraft}
          autoFocus
          placeholder="Nome da tag"
          width={140}
          height={34}
          fontSize={12.5}
          paddingHorizontal={12}
        />
      ) : (
        <Button
          onPress={() => setAdding(true)}
          size="$2"
          height={34}
          backgroundColor="transparent"
          borderColor="$primary"
          borderWidth={1}
          borderStyle="dashed"
          borderRadius={999}
          color="$primary"
          fontSize={12.5}
          fontWeight="600"
          paddingHorizontal={12}
        >
          + Nova tag
        </Button>
      )}
    </XStack>
  );
}
