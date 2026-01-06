import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Smile, X, Plane, UtensilsCrossed, Sparkles, TreePine, Clock, Heart, Building, Music, Gamepad2 } from 'lucide-react';
import { useState } from 'react';

interface EmojiPickerProps {
    value?: string;
    onChange: (emoji: string | undefined) => void;
    triggerClassName?: string;
}

const EMOJI_CATEGORIES: Record<string, { icon: React.ReactNode; label: string; emojis: string[] }> = {
    viagem: {
        icon: <Plane className="w-4 h-4" />,
        label: 'Viagem',
        emojis: [
            '✈️', '🛫', '🛬', '🚗', '🚕', '🚌', '🚎', '🚐', '🚑', '🚒',
            '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝',
            '🚢', '⛴️', '🛳️', '🚤', '⛵', '🛥️', '🚁', '🛶', '🎢', '🎡',
            '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽',
            '🗺️', '🧳', '🎒', '👜', '🧭', '⛺', '🏕️', '🏖️', '🏝️', '🏜️',
            '🛤️', '🛣️', '🚏', '🚦', '🚥', '⛽', '🅿️', '🎫', '🛂', '🛃',
        ],
    },
    comida: {
        icon: <UtensilsCrossed className="w-4 h-4" />,
        label: 'Comida',
        emojis: [
            '🍽️', '🍴', '🥢', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈',
            '🥐', '🥖', '🥨', '🥯', '🍞', '🧀', '🥚', '🍳', '🧇', '🥞',
            '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆',
            '🍣', '🍱', '🍜', '🍝', '🍛', '🍤', '🦪', '🍙', '🍚', '🍘',
            '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷',
            '🍸', '🍹', '🧉', '🍾', '🫖', '🍩', '🍪', '🎂', '🍰', '🧁',
            '🍫', '🍬', '🍭', '🍮', '🍯', '🍦', '🍧', '🍨', '🥧', '🧊',
        ],
    },
    atividades: {
        icon: <Sparkles className="w-4 h-4" />,
        label: 'Atividades',
        emojis: [
            '🎭', '🎪', '🎨', '🖼️', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁',
            '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🎯', '🎳', '🎮', '🕹️',
            '🏛️', '⛪', '🕌', '🕍', '⛩️', '🛕', '💒', '🏗️', '🌆', '🌇',
            '🌃', '🌉', '🎠', '🎡', '🎢', '💈', '🎰', '🎱', '🏆', '🥇',
            '📸', '📷', '📹', '🎥', '📽️', '🎞️', '📺', '📻', '🎙️', '📢',
            '🧘', '🏊', '🚴', '🏃', '🚶', '🧗', '🏄', '🤿', '🎿', '⛷️',
        ],
    },
    natureza: {
        icon: <TreePine className="w-4 h-4" />,
        label: 'Natureza',
        emojis: [
            '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏞️', '🌊', '🏖️', '🌅', '🌄',
            '🌠', '🎇', '🎆', '🌌', '🌉', '🌁', '🌴', '🌲', '🌳', '🌵',
            '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '💐', '🪻', '🪷', '🪹',
            '🦋', '🐝', '🐞', '🦗', '🪲', '🐚', '🦀', '🦞', '🦐', '🦑',
            '🐠', '🐟', '🐬', '🐳', '🦈', '🐙', '🪸', '🐢', '🦭', '🦩',
            '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️',
            '⭐', '🌟', '✨', '💫', '🌙', '🌑', '🌒', '🌓', '🌔', '🌕',
        ],
    },
    tempo: {
        icon: <Clock className="w-4 h-4" />,
        label: 'Tempo',
        emojis: [
            '⏰', '⏱️', '⏲️', '🕰️', '⌛', '⏳', '📅', '📆', '🗓️', '📇',
            '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙',
            '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣',
            '🌅', '🌄', '🌇', '🌆', '🌃', '🌌', '🌙', '🌛', '🌜', '🌝',
            '☀️', '🌞', '🌤️', '⛅', '🌥️', '🌦️', '🌧️', '🌨️', '❄️', '🌡️',
        ],
    },
    lugares: {
        icon: <Building className="w-4 h-4" />,
        label: 'Lugares',
        emojis: [
            '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪',
            '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌',
            '🕍', '⛩️', '🛕', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄',
            '🌅', '🌆', '🌇', '🌉', '🎠', '🛝', '🎡', '🎢', '🎪', '🗾',
            '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🗺️',
        ],
    },
    entretenimento: {
        icon: <Music className="w-4 h-4" />,
        label: 'Shows',
        emojis: [
            '🎵', '🎶', '🎼', '🎹', '🎸', '🎷', '🎺', '🎻', '🪕', '🥁',
            '🎤', '🎧', '🎚️', '🎛️', '🎬', '🎭', '🎪', '🎨', '🖼️', '🎰',
            '🎲', '🎯', '🎳', '🎮', '🕹️', '🧩', '♠️', '♥️', '♦️', '♣️',
            '🃏', '🀄', '🎴', '🎱', '🔮', '🧿', '🎐', '🎏', '🎎', '🎑',
            '🎀', '🎁', '🎈', '🎉', '🎊', '🎋', '🎍', '🎄', '🎃', '🪅',
        ],
    },
    esportes: {
        icon: <Gamepad2 className="w-4 h-4" />,
        label: 'Esportes',
        emojis: [
            '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
            '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
            '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
            '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤺', '⛹️',
            '🏊', '🚴', '🚵', '🧗', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊',
        ],
    },
    sentimentos: {
        icon: <Heart className="w-4 h-4" />,
        label: 'Outros',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
            '✅', '❌', '⭕', '❗', '❓', '💡', '🔥', '💎', '👑', '🎯',
            '📍', '📌', '🏷️', '💼', '📝', '📋', '📁', '📂', '🗂️', '📰',
            '💰', '💵', '💴', '💶', '💷', '💳', '🧾', '💸', '🪙', '💲',
            '🔑', '🗝️', '🔒', '🔓', '🔐', '🔏', '🛡️', '⚔️', '🗡️', '💣',
        ],
    },
};

const CATEGORY_KEYS = Object.keys(EMOJI_CATEGORIES);

export const EmojiPicker = ({ value, onChange, triggerClassName = '' }: EmojiPickerProps) => {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(CATEGORY_KEYS[0]);

    const handleSelect = (emoji: string) => {
        onChange(emoji);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(undefined);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full hover:bg-white/10 ${triggerClassName}`}
                    type="button"
                >
                    {value ? (
                        <span className="text-lg leading-none">{value}</span>
                    ) : (
                        <Smile className="w-4 h-4 text-muted-foreground" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[320px] p-0 bg-[#1a1a1a] border-white/10"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* Header with clear button */}
                {value && (
                    <div className="px-2 py-1.5 border-b border-white/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-white/5 h-7"
                        >
                            <X className="w-3 h-3 mr-2" />
                            Remover ícone
                        </Button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex border-b border-white/10 px-1 py-1 gap-0.5 overflow-x-auto scrollbar-hide">
                    {CATEGORY_KEYS.map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`
                p-1.5 rounded-md transition-colors shrink-0
                ${activeTab === key
                                    ? 'bg-white/15 text-white'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                }
              `}
                            title={EMOJI_CATEGORIES[key].label}
                        >
                            {EMOJI_CATEGORIES[key].icon}
                        </button>
                    ))}
                </div>

                {/* Emoji Grid */}
                <div
                    className="p-2 h-[200px] overflow-y-auto overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="grid grid-cols-8 gap-0.5">
                        {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, idx) => (
                            <button
                                key={`${emoji}-${idx}`}
                                type="button"
                                onClick={() => handleSelect(emoji)}
                                className={`
                  p-1.5 rounded-md hover:bg-white/10 transition-colors text-xl leading-none
                  flex items-center justify-center
                  ${value === emoji ? 'bg-primary/30 ring-1 ring-primary' : ''}
                `}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer - Category Label */}
                <div className="px-3 py-1.5 border-t border-white/10 text-xs text-muted-foreground">
                    {EMOJI_CATEGORIES[activeTab].label}
                </div>
            </PopoverContent>
        </Popover>
    );
};
