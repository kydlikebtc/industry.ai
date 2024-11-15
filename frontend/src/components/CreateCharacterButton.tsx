'use client'

import { useCharacterSelect } from '@/contexts/CharacterSelectContext'

function CreateCharacterButton() {
    const { setIsOpen } = useCharacterSelect()

    return (
        <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
            Create Character
        </button>
    )
}

export default CreateCharacterButton 