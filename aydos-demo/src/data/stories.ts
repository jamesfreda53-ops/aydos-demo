import { Story } from "../types";
import { storyImage, storyAudio } from "../utils/storyAssets";

const STORY_ID = "odyssey";

// Expected files on disk:
// public/stories/odyssey/images/title.png, 1.png, 2.png, 3.png, 4.png, 5.png, 6.png
// public/stories/odyssey/audio/lotus_1.wav, lotus_2.wav, lotus_3.wav, lotus_4.wav, lotus_5.wav, lotus_6.wav

export const STORIES: Story[] = [
  {
    id: STORY_ID,
    title: "The Odyssey: The Lotus Eaters",
    subtitle: "hows odysseus gonna wiggle his way outta this one huh",
    author: "Homer",
    readingLevel: "Intermediate",
    levelBadge: "Intermediate",
    estimatedMinutes: 4,
    genre: "Adventure",
    themeColor: "from-amber-600 to-orange-800",
    accentColor: "#d97706",
    coverImage: storyImage(STORY_ID, "title.png"),
    summary:
      "After a fierce storm blows his ships off course, Odysseus and his crew land among a peaceful people whose strange fruit makes sailors forget home entirely.",
    titleSlide: {
      title: "The Odyssey Part II: The Lotus Eaters",
      subtitle: "A tale of temptation, memory, and the pull of home",
      author: "Homer",
      illustrationUrl: storyImage(STORY_ID, "title.png"),
      illustrationCaption: "",
      introParagraph:
        "",
      audioUrl: storyAudio(STORY_ID, ""),
    },
    slides: [
      {
        id: "odyssey-1",
        slideNumber: 1,
        paragraph:
          "Blood is not quick to cool. When men have been a while at war, it is not so easy for them to return home. So it was with Odysseus' men, and when they stopped at Ismarus, home of the humble Cicones, they set upon the village with savage hearts. They took what they saw, and when the men of the Cicones resisted, they slaughtered the men, and took the women as slaves. They butchered the lambs, and drunk deeply of their wine, and fell into a stupor under the eastern sun.",
        illustrationUrl: storyImage(STORY_ID, "1.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_1.wav"),
        keyWords: ["howling", "weary", "quiet", "strange", "flowering"],
      },
      {
        id: "odyssey-2",
        slideNumber: 2,
        paragraph:
          "A boy had escaped from the massacre, and the boy told the nearby villages of the Greeks' crimes. The men of these villages took up their spears, and readied their horses, and marched on the coast, where they found Odysseus and his men still drunk on the dregs of the Cicones' wine. The eastern men attacked the Greeks, riding them down on horseback and sinking their blades into those who tried to run. The sea was thick with Greek blood that day, and very few made it back to their ships.",
        illustrationUrl: storyImage(STORY_ID, "2.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_2.wav"),
        keyWords: ["scout", "gentle", "lotus", "sweet", "island"],
      },
      {
        id: "odyssey-3",
        slideNumber: 3,
        paragraph:
          "Zeus saw what the Greeks had done to the Cicones, and was greatly angered. He conjured a terrible storm and brought it down upon Odysseus' ship. The winds tore at their sails and drove them from their course. The stars, once fixed in the sky, scattered before the Greeks' eyes, and great waves crashed over them, dragging many into the dark sea, filling their lungs with bitter seawater and delivering their bodies to scuttling, crawling creatures of the deep.",
        illustrationUrl: storyImage(STORY_ID, "3.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_3.wav"),
        keyWords: ["greeted", "honeyed", "gift", "suspecting", "accepted"],
      },
      {
        id: "odyssey-4",
        slideNumber: 4,
        paragraph:
          "After three days, the storm subsided, and the sea grew calm. Odysseus did not know these waters, and when they came upon dry land, they found a race of strange men, with strange customs. There were palaces high atop red cliffs, and white-sand beaches where dark-haired women harvested the fruits of the sea. These were the Lotus-Eaters, who cherished that enchanted flower, and when they received Odysseus, and brought him to their midday meal, he and his men too ate of this flower.",
        illustrationUrl: storyImage(STORY_ID, "4.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_4.wav"),
        keyWords: ["tasted", "peace", "melted", "journey", "distant"],
      },
      {
        id: "odyssey-5",
        slideNumber: 5,
        paragraph:
          "The land of the Lotus-Eaters was beautiful. The women of this tribe were beautiful, and the men too were beautiful, and under the spell of the lotus-flower, Odysseus and his men fell into a waking dream. The flower warmed their aching bodies, and dulled their troubled minds, and the women of the tribe washed them and anointed their hair with fragrant oils. They partook of many pleasures in that land, and did not wish to leave.",
        illustrationUrl: storyImage(STORY_ID, "5.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_5.wav"),
        keyWords: ["ashore", "happily", "flowers", "forever", "discovering"],
      },
      {
        id: "odyssey-6",
        slideNumber: 6,
        paragraph:
          "Days turned to weeks, and the Greeks continued to eat the lotus, and soon they forgot themselves. They forgot their homes, their gods, their language. They lay with the women and played with the men, and wanted for nothing. Odysseus himself nearly forgot his own name, and fell into a deep sleep, and in this sleep he saw the face of a woman, and upon waking he remembered that this was Penelope, and she was his wife, and he needed to return to her, and could not remain among the lotus-eaters any longer.",
        illustrationUrl: storyImage(STORY_ID, "6.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_6.wav"),
        keyWords: ["dragged", "weeping", "struggling", "ordered", "fade"],
      },  
       {
        id: "odyssey-7",
        slideNumber: 7,
        paragraph:
          "The women of the tribe sensed he was troubled, and tried to feed him the calming petals, and slake his thirst with the fragrant tea. But he shook them off, and refused the drug, and tried to rouse his men from their stupor. Some were too far gone, lost in the dream, and remained with the lotus-eaters. But some he managed to wake, and though they resisted, he drove them back to their ship. The men wailed for many days and nights, pained to be separated from the enchanted lotus and the dreams it brought, but Odysseus did not heed their pleas, and he set their ship on course for Greece once more.",
        illustrationUrl: storyImage(STORY_ID, "7.png"),
        illustrationCaption: "",
        audioUrl: storyAudio(STORY_ID, "lotus_7.wav"),
        keyWords: ["dragged", "weeping", "struggling", "ordered", "fade"],
      },
    ],
    quizQuestions: [
      {
        id: "odyssey-q1",
        type: "multiple_choice",
        question: "[PLACEHOLDER] What effect did the lotus fruit have on the sailors who ate it?",
        options: [
          "It made them forget their home and desire to return",
          "It made them fall asleep instantly",
          "It made them extremely strong",
          "It made them unable to speak",
        ],
        correctIndex: 0,
        explanation:
          "[PLACEHOLDER] The lotus fruit erased the sailors' longing for home, leaving them content to stay forever.",
      },
      {
        id: "odyssey-q2",
        type: "true_false",
        question: "[PLACEHOLDER] The Lotus Eaters were hostile and attacked Odysseus's scouts.",
        correctBoolean: false,
        explanation:
          "[PLACEHOLDER] The Lotus Eaters were peaceful and simply offered their fruit as a gift.",
      },
      {
        id: "odyssey-q3",
        type: "multiple_choice",
        question: "[PLACEHOLDER] How did Odysseus get his men back to the ships?",
        options: [
          "He dragged them back by force and tied them down",
          "He convinced them with a speech",
          "He offered them a different fruit",
          "He left them behind",
        ],
        correctIndex: 0,
        explanation:
          "[PLACEHOLDER] Odysseus physically dragged his weeping men back and restrained them so the ships could leave.",
      },
    ],
  },
];
