'use client'
import { pixelify_sans } from '@/app/fonts';

import { useCharacterSelect } from '@/contexts/CharacterSelectContext';

function CreateCharacterButton() {
    const { setIsOpen } = useCharacterSelect()

    return (
        <button
            onClick={() => setIsOpen(true)}
            className={`${pixelify_sans.className} bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded`}
        >
            Create Character
        </button>
    )
}

export default CreateCharacterButton 