// Vendor
import React, { KeyboardEventHandler, MouseEventHandler, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { isEmpty } from 'lodash';

// App
import { HelpQuestionMarkIcon } from 'app/icons/ContactAndHelpIcons';
import PopupLabelWrapper from 'app/components/PopupLabelWrapper';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import VoiceoverRespellService from 'shared/services/VoiceoverRespellService';
import { useJumpVideoToTime } from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import { useConfirmationModalProtectedAction } from 'shared/hooks/confirmationModal';
import WaymarkToggleSwitch from 'shared/components/WaymarkToggleSwitch';

// Editor
import { useEditorState } from 'editor/providers/EditorStateProvider';
import {
  ScriptLengthQuality,
  scriptQualityIndicatorValues,
} from 'editor/constants/automatedVoiceOver';

// Local
import * as styles from './VoiceOverScriptEditor.css';
import { themeVars, typographyStyleVariants, utilityClasses } from '@libs/shared-ui-styles/src';
import { Speaker } from '@libs/tts-lib/src';
import { AutofillVideoDescriptorThin } from '@libs/shared-types/src';
import { useRewriteScript } from './state/textToSpeechStore';
import { AttributionIconCompanies } from '@libs/shared-ui-components/src';

interface VoiceOverScriptEditorProps {
  scriptText: string;
  setScriptText: (scriptText: string) => void;
  selectedSpeaker: Speaker | null;
  scriptLengthQuality: ScriptLengthQuality;
}

export default function VoiceOverScriptEditor({
  scriptText,
  setScriptText,
  selectedSpeaker,
  scriptLengthQuality,
}: VoiceOverScriptEditorProps) {
  const [isWritingMode, setIsWritingMode] = useState<boolean>(false);
  const [selectedWordsToRespell, setSelectedWordsToRespell] = useState<number[]>([]);
  const [isRespellingWords, setIsRespellingWords] = useState<boolean>(false);

  const doesScriptExceedCharacterLimit =
    scriptLengthQuality === ScriptLengthQuality.ExceedsCharacterLimit;

  const { isRewritingScript, rewriteScript } = useRewriteScript();
  const { videoDescriptor, appliedBusinessGUID } = useEditorState();

  const convertedVideoDescriptor: AutofillVideoDescriptorThin = {
    templateSlug: videoDescriptor.__templateSlug,
    __activeConfiguration: videoDescriptor.__activeConfiguration,
  };

  const [openConfirmationModal, confirmationModalContents] = useConfirmationModalProtectedAction(
    async () => {
      setSelectedWordsToRespell([]);
      await rewriteScript(convertedVideoDescriptor, appliedBusinessGUID, selectedSpeaker?.pace);
    },
    {
      title: 'Rewrite Script',
      subtitle: 'Overwrite the current script based on your video’s content.',
      confirmButtonText: 'Rewrite',
      modalProps: {
        cancelInterface: 'text',
      },
    },
  );

  const jumpVideoToTime = useJumpVideoToTime();

  // * Splits the script text into an array of words, including whitespace and punctuation.
  const scriptWords = useMemo(
    () => scriptText.split(/(\s+|[.,;!?]+|\b(?!-)(?![\w']*))/) || [],
    [scriptText],
  );

  const handleTextAreaEvent = (
    e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement>,
  ) => {
    jumpToTimestampForCharacter(e.currentTarget.selectionStart);
  };

  const jumpToTimestampForCharacter = (characterIndex: number) => {
    const scriptBefore = scriptText.substring(0, characterIndex);
    const durationInSeconds = selectedSpeaker?.estimateDuration(scriptBefore);
    jumpVideoToTime(durationInSeconds);
  };

  const jumpToTimestampForWord = (wordIndex: number) => {
    const wordsBefore = scriptWords.slice(0, wordIndex).join(' ');
    const durationInSeconds = selectedSpeaker?.estimateDuration(wordsBefore);
    jumpVideoToTime(durationInSeconds);
  };

  // A function that adds a word to the list of words to respell if it is not already in the list, in which case it removes it from the list
  const toggleWordToRespell = (wordIndex: number) => {
    if (selectedWordsToRespell.includes(wordIndex)) {
      setSelectedWordsToRespell(
        selectedWordsToRespell.filter((index) => index !== wordIndex).sort(),
      );
    } else {
      jumpToTimestampForWord(wordIndex);
      setSelectedWordsToRespell([...selectedWordsToRespell, wordIndex].sort());
    }
  };

  const encodeXml = (value: string) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\t/g, '&#x9;')
      .replace(/\n/g, '&#xA;')
      .replace(/\r/g, '&#xD;');
  };

  // A function that formats the words to be respelled into a format that the respell API can understand (XML string)
  const formatWordsForRespelling = () => {
    if (selectedWordsToRespell.length === 0) {
      return '';
    }

    // Getting the words to respell using the selectedWordsToRespell array of indexes, and the scriptWords array of words
    const words = selectedWordsToRespell.map((index) => scriptWords[index]);

    // Formatting the words to be in an XML-like format for the respell API
    let formattedWords = '<words-list>';
    words.forEach((word, index) => {
      formattedWords += `<word-${index + 1}>${encodeXml(word)}</word-${index + 1}>`;
    });
    formattedWords += '</words-list>';
    return formattedWords;
  };

  const respellWords = async () => {
    setIsRespellingWords(true);

    try {
      const respelling = await VoiceoverRespellService.respellWords({
        text: formatWordsForRespelling(),
      });

      selectedWordsToRespell.forEach((wordIndex, loopIndex) => {
        scriptWords[wordIndex] =
          respelling.getElementsByTagName(`pronunciation-${loopIndex + 1}`)[0]?.childNodes[0]
            ?.nodeValue ?? scriptWords[wordIndex];
      });

      setScriptText(scriptWords.join(''));
    } catch (e) {
      console.error(e);
    }

    setSelectedWordsToRespell([]);
    setIsRespellingWords(false);
  };

  return (
    <>
      <div className={styles.ScriptContainerTop}>
        <div className={styles.ScriptQualityIndicatorContainer}>
          <div>
            <p className={styles.EditModeText}>{isWritingMode ? 'Writing Mode' : 'AI Mode'}</p>
            {selectedSpeaker && selectedSpeaker.pace ? (
              <>
                {scriptQualityIndicatorValues[scriptLengthQuality].message}
                <span
                  style={assignInlineVars({
                    [styles.scriptQualityIndicatorColor]:
                      scriptQualityIndicatorValues[scriptLengthQuality].color,
                  })}
                  className={styles.ScriptQualityIndicator}
                />
              </>
            ) : null}
          </div>
          <div className={styles.ChangeEditingModeContainer}>
            <p className={typographyStyleVariants.caption2}>Write</p>
            <WaymarkToggleSwitch
              isChecked={isWritingMode}
              isInProgress={false}
              onToggleChecked={() => {
                setIsWritingMode(!isWritingMode);
                setSelectedWordsToRespell([]);
              }}
            ></WaymarkToggleSwitch>
          </div>
        </div>
      </div>
      {!isWritingMode ? (
        <div
          className={css`
            transition: all 0.2s ease-in-out;
            border-radius: 0px;
            border: ${themeVars.color.shadow._36} 1px solid;
            border-bottom: none;
            border-top: none;
            padding: 8px;
          `}
        >
          {/* Adding a button for each word in the script as long as it's not a single character, line-break, or empty */}
          {scriptWords &&
            scriptWords.map((word, index) =>
              word && word.length > 1 && !word.match('(\r\n|\r|\n)') ? (
                <WaymarkButton
                  key={index}
                  isUppercase={false}
                  colorTheme={selectedWordsToRespell.includes(index) ? 'Primary' : 'Secondary'}
                  // Overriding the default styles for the WaymarkButton
                  style={{
                    display: 'inline',
                    padding: '1px 2px',
                    margin: '2px',
                    borderRadius: '4px',
                  }}
                  isSmall
                  typography="bodyRegular"
                  onClick={() => toggleWordToRespell(index)}
                >
                  {word}
                </WaymarkButton>
              ) : (
                word !== ' ' && !isEmpty(word) && <span key={index}>{word}</span>
              ),
            )}
          {/* Helper to show in the AI mode if the script is empty */}
          {isEmpty(scriptText) && (
            <p className={styles.HelperText}>
              Use the Rewrite feature to get a fresh script, or toggle Write to draft your own.
            </p>
          )}
        </div>
      ) : (
        <WaymarkTextInput
          placeholder="Write your voice-over script here."
          value={scriptText}
          onChange={(e) => setScriptText((e.target as HTMLTextAreaElement).value.trim())}
          onKeyUp={handleTextAreaEvent as KeyboardEventHandler<HTMLTextAreaElement>}
          onClick={handleTextAreaEvent as MouseEventHandler<HTMLTextAreaElement>}
          shouldExpandWithDynamicRows
          minRows={2}
          // Make the input turn red if the script exceeds the character limit
          hasError={doesScriptExceedCharacterLimit}
          className={css`
            + div {
              transition: all 0.2s ease-in-out;
            }
            /* used to correctly style the lower section of the
                  script text box when the textarea is focused */
            &:focus-within + div {
              border-color: ${themeVars.color.brand.default};
            }

            &[data-haserror='true'] + div {
              border-color: ${themeVars.color.negative.default};
            }
          `}
          inputClassName={css`
            textarea {
              border-bottom: none;
              border-top: none;
              border-radius: 0px;
            }
          `}
        />
      )}
      <div className={styles.ScriptContainerBottom}>
        <div className={styles.ScriptQualityIndicatorContainer}>
          {!isWritingMode && (
            <>
              <div className={styles.RespellButtonContainer}>
                <WaymarkButton
                  isLoading={isRespellingWords}
                  isSmall
                  isDisabled={
                    selectedWordsToRespell.length == 0 ||
                    selectedSpeaker?.providerName !== AttributionIconCompanies.WellSaidLabs
                  }
                  colorTheme="Secondary"
                  onClick={() => respellWords()}
                >
                  Respell
                </WaymarkButton>
                <PopupLabelWrapper label="Get a phonetic respelling (For WellSaid Labs voices only)">
                  <HelpQuestionMarkIcon
                    className={utilityClasses.flexCenter}
                    width={18}
                    height={18}
                  />
                </PopupLabelWrapper>
              </div>
              <WaymarkButton
                isLoading={isRewritingScript}
                onClick={() => openConfirmationModal()}
                isSmall
                colorTheme="AI"
                className={styles.RewriteButton}
              >
                Rewrite
                {!isRewritingScript && <p className={styles.RewriteBetaText}>(beta)</p>}
              </WaymarkButton>
            </>
          )}
        </div>
      </div>
      {confirmationModalContents}
    </>
  );
}
