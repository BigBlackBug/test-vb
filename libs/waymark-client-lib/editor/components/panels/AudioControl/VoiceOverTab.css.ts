import "../../libs/shared-ui-styles/src/reset.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/reset.css.ts.vanilla.css\",\"source\":\"KiwgKjpiZWZvcmUsICo6YWZ0ZXIgewogIGJveC1zaXppbmc6IGJvcmRlci1ib3g7Cn0KaHRtbCB7CiAgbGluZS1oZWlnaHQ6IDEuMTU7CiAgdGV4dC1zaXplLWFkanVzdDogMTAwJTsKICAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6IHRyYW5zcGFyZW50OwogIC13ZWJraXQtZm9udC1zbW9vdGhpbmc6IGFudGlhbGlhc2VkOwogIHRleHQtcmVuZGVyaW5nOiBnZW9tZXRyaWNQcmVjaXNpb247CiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0td2h0KTsKfQpib2R5IHsKICBtYXJnaW46IDA7CiAgcGFkZGluZzogMDsKICBmb250LWZhbWlseTogdmFyKC0tZm9udC1mYW1pbHkpOwp9CmgxLCBoMiwgaDMsIGg0LCBoNSwgaDYsIHAgewogIG1hcmdpbjogMC41ZW0gMDsKICB3b3JkLWJyZWFrOiBrZWVwLWFsbDsKfQppbnB1dCwgYnV0dG9uLCBzZWxlY3QsIG9wdGdyb3VwLCB0ZXh0YXJlYSB7CiAgbWFyZ2luOiAwOwogIGZvbnQtZmFtaWx5OiBpbmhlcml0OwogIGZvbnQtc2l6ZTogaW5oZXJpdDsKICBsaW5lLWhlaWdodDogaW5oZXJpdDsKfQpmaWd1cmUgewogIG1hcmdpbjogMDsKfQpmaWVsZHNldCB7CiAgcGFkZGluZzogMDsKICBtYXJnaW46IDA7CiAgYm9yZGVyOiAwOwp9CmxlZ2VuZCB7CiAgcGFkZGluZzogMDsKfQphOmZvY3VzLCBidXR0b246Zm9jdXMgewogIG91dGxpbmU6IG5vbmU7Cn0KYTpmb2N1cy12aXNpYmxlLCBidXR0b246Zm9jdXMtdmlzaWJsZSB7CiAgb3V0bGluZTogMXB4IHNvbGlkIHZhcigtLWJyYW5kLWRlZmF1bHQpOwp9CmJ1dHRvbiB7CiAgZm9udC1mYW1pbHk6IGluaGVyaXQ7CiAgY3Vyc29yOiBwb2ludGVyOwogIGFwcGVhcmFuY2U6IG5vbmU7CiAgYm9yZGVyOiAwOwogIHBhZGRpbmc6IDA7Cn0=\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/fonts/waymarkNeueHaasUnica/waymarkNeueHaasUnica.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/fonts/waymarkNeueHaasUnica/waymarkNeueHaasUnica.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA83SMWvDMBAF4D2/QmRKhhadLOkkZ8nYqVvJGE7SqTV1bGM7BFP630sKDRQyOFMy6iGOj8fb5rYZnzJFFl8LIX5fqRq6mqZSDCfqNn/pME41l6Jp+wPV53ToYymOfb1yBhFQRhM0GAuGU/TP7ZjXIp8/j6tl23EzTh0v15dzJ67eP8ZSKCkvWaZDVU+l2NF0oP5zx2G/f+UjvxANb00VabP4XmxvFVcj1VX8JzaogowESmIyRgVF6ZHEVzrWBWivfMJoZIDAZGWaLdb36NhlVI5AkgL0VKD1lh5IfKVjylJS0IoVAetUBFmY2WJzlx2Tg2xDVpg8BMMgMT6Q+NqO0RWBMEC0DD5Gtuhmi909OlaFTiq65KPz0trEPsxfxa3iHyp6R/6PBQAA\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/themes/waymark.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/themes/waymark.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA3WUS2+bQBSF9/0VI3WRVoKIecGYrhwnqJt20arqshqbsY2CwQKcNK363ysDc828svDinsN3LofJ5F3bDhHK863cPZdde0Z/3yEUx9tONmVcyu45R+8TxpnYfFoKai8v9ZCj94QJsSmWWl0djleFPTywQiv1yBn/psnr6CmeikJ7+qMs29e4b+uqzFF32H5gEWIRwuKjYViloypBjlByv0pNk2Aek2CmKSMeU0ZME/fFcSuO+kzUMhHfTsTaCftI2CIlwmNKdE/jB1j2SHgSIcLJ9YcaJujSsBiFTkbo0zFCqZMROnWMUOxk5MFobkbToJGaRhLckZg74iARm0To2TFC2f2l28udWtaN2fWbcB4hfDtMsw0KN0zmCZ6tULljvZ3j2QqlO1ZnAR5cgNsL0KCV2lYS3JXYu+IgFdtUqN+xQv2yindt3XZY31Ub8khJ6ohwXz0+FZhSW9d3VpEUj5kwVaLR6ye6EWtHvKEzhteZrQOarVaPs3pu+2qoXhRcsFm2IdjWAJysVhuytmTNpet1wdkkNuogl1xBCNUX7k27LbzGK0eGfQvG4bKWXVM1h8WjaiWoreon90KJcq543zZDvJenqn7L0d1P+XaS3fNPtf3166u6qM9S9j+aaifvInT3WdUvaqh2El2luwjBIELrrpJ1hHrZ9HGvumq/oL8O8XCsmhwRvZAed+pwqWWXI2YrJ1VWl1OOuC1s27rMUWaPj0q+vOVI6PlQDbVK4lc1vXJmzfvqj8pRys6/jXF99A378y5HMb7nhoADcDzDmbDsV7g71HBi0kmATmY6TS37le4OJ3pyn5l0GqBTTU8s+0gn9lDTTTgLwNkMJ8Kyj/DEHo7wpu1Osl4IPADnGm5+PT7CSWoP/fA0AE813FwyneDEHjrwbVu+fZuOOiTAiV+KUwyGdZfamJV4FW/gl/E/CPL4Mm/WfHGz5KZpwRv20NalWx4ovqBRcGOmsTfk+0nWtb/ASZpj6JI3KdccM36eh4PCr3STg4Hwcp7Q0BtehqFtIBFusnnuVDiNxwxhD0d4co+5KZgFWglGhcT3oPU+S2UOhLydPA9V22A3DBQ7CQQz5jYOZBD3iIMSyCD+DOL5KrNE3WMHyhyCLdp0aWLmjpcv8u8/OeA/wuANAAA=\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/fonts/openSans/openSans.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/fonts/openSans/openSans.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA8XTTWrDMBCG4X1OIbJKFi36tSRnkxt00ROMRjOtwXGMrRBM6d1LCg0UvHChOEt9CPHygI587soTA5L42AjxfcrN2Lcw1WK8Qn/4WccytVSL7jycoL2t44C1uAztzrnspHJokLI0TkmqzHMpvBd8u1x22zJcqEw9bff3567UvL2XWhgp7xvDqWmnWrz01IlX6MbD5nNz/GthU6Bt8FdhyhxVZNZsyOqk0KF/YOGMofcoo9ZGS6ucBQrZLje0axiCiR4sKsIsfeUck7EPLJwxBBuiTaZK1hsf0Ht0vLjQrWGIKlgyCihVTClHjjo8sHDGULPyABSClS6gg+DycsNqDUODOWOuNGlw2aYkpaUHFs4YMlgdMGdNxljSiaJc/lP8GoZUSaJEvmJFkcAwyvhvhV+L+Yw7UwYAAA==\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/themes/spectrumReachSDK.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/themes/spectrumReachSDK.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA3WUy47aMBiF930KS11MKxEU27mYdEVhsqsqdR6gMsSBaEKCkjDMtOq7V8SX+IoEi3NOvmP/MV7/hnkWT/f3uBj6flqBtRJAURzo8bUa+iv4+wmAKDoMtKuiig6vBfgcxzhO82+6wWp6a6fZyxitdK9tTueHw9Ia1kQ4Lec8Ply5z5nyuSzLkivjmVb9PRr7tqkKMJwOX7JkBfj3qxHZZLNPtcAKxOtNZsZI4o0Ri5YjbyxHZiz1l6ZWKfbHsBVD/rUha23QT4MWLSbeWExEbH4l+mQRIisgf4yQmq0RMcbLg2q6TlANmAfVfJ2gGjEPpsHq1KzGwSA2gyi4RmSuEQaJ0CSqSTtBNezxNtT0yPRxw4SsgPyxYmrgRsg8zyKqRu5ElzMtomroTnQ51yKaBheQ2gvAwSi2oyi4VmSvFQap0Kaq8TtRNX7aRMe+7Qcob68d2mOUOaa6wfbPJcTY9uUtVsblPiemiyR6+4x3ZOuYCzpP4Da3fYVONpu9cK/92EzNG1NXbp7vELS95dbdbHZoa9mSi7fbMk242bET1bkHslzBi6e4x6PHllzdvNOha7qT9ijbEGy78smaMFKJEdd9N0U1vTTtRwGefl5ZB15oNz6twEi7MRrZ0NRa8j5F07npCoAkXMoDO91aOhQgsZ0Lq5rbpQCpbRz6tipAbstnRt8+CkCkPjVTy+Lozvjyc0sfmz+sAFlyfTfk9uwTx+uxABFcp4YBA3Ao4Amx4g+4K0o4MukoQEeCjjMr/qC7IqfH69yk4wAdS3psxWc6skVJN+FJAJ4IOCJWfIbHtjjDu3640FYz0gA8lXDz7aUzHGW26IdnAXgm4eYiMw5HtujAD3318YsfddWgTrxu8hqolqt7c1fsdbyFP+Z/kOpL9T7h+eqE5bZJw1v2vW8rd3jK8RXNhlvDZW/Jy4W2rX+A3BI1WOdx59Fj1gs9XBTe0mIHC9XmPKWhHd6mqe882+O6M0Iuzx3EFmd4vIapaYQGqJmiBvketPajO6JQ9R3pdWr6brkj1cWsHLtJGWbNIgc6kHvElRPoQP4O5HkrwsLu1JQjSqBF45cmTFxZ38i//yLCabfTDQAA\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/buttonStyleVariants.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/buttonStyleVariants.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA82W226jMBCG7/MUo0pIqQSIQzjuzb7JyoABq8SObJN2u+q7r4AkJTYQkLLS3jQ1MP984398+PmGf5ccHbGAX64TnTy/cuDPDsAxTHAdx+gHABnK3yrOWlpYJyaIJIymw/vuz48dwNcOIFj+3jHg+u3Xzr7mc/uQUUDOGsZTOCO+t6yMI1pYBS5R28jXLvju9XvdPRyrpTU7Y27C6EnJ8lZYZyJI1uAV2RpSqbLeYphoeYlybLmhTihqVLB3KwkVQY3T28B5Tegrqv5i1DBZ6/h8jc/fwNfPoKZ5WK5pAHHiWUZX0QsUvRQ4KghqrKr7xVTuE98ODgZ4fmBHkQFIgm/7sQHuwQ4Dw7zIDx16xhfj+96f6r6+1+d6cM0aGX0hyCe+ezuuK0V5x9OXhyg5okGLMopnE00LqSYGyyYOVF5H5V2YR/m/d4hYQN5mJLcy/Ekw39ux6Zi2Z7qvQGhJKJEYUCMxp0hiyJis77jCf24cIkNzuY/Mu7SWYA0pnuti+CwXQ83F8L9wMVqznJOJLVHbtCOtwmjLZjhkig/3orHWZJIjKk6IYyoXt0GAjPEC8xTc0wf0rfH9cL7KcW6toHiioNkqFnOpdSaLk0Nxhfolsv4ITTT4ZIMbt4QTpyjSLLkuhkfMYxENDz2a2yWm7Nkne5aiUmJ+oaASU5nCy0sX/r3OUSZY08q+dslOKYSnj+7/BpfyNuAd7W2UMSnZcTTsO6TbMFuRAqE15kSqzVsgUePiEbA6odkTriL5Oq+17ss1mvyRvdO3jWIdwMykFBpGsWUFj5TU6VvmiDwlWuPAKzkCpaJyHYd64R4raCzlI5bZC3W1hWYqXmOp1rFMVlZvvzcvqJEZtRXnj2o/0cokm+z/C+MBqDLgDQAA\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/typography.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/typography.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA43WyW6DMBCA4XuegmNzIKrZuuTWey/tA1QEHHBqICJOqrTKu1fCLA42M3MdfotPsg+z+WLV5XD4Zo/e38rz9k2t/H1aCXl99S5p++D7xmi9Xd1Wm+EEm06cxC8feiWU5I/daL0dgh8uilLNEj3sIilq7peuSJY64Erx1j8d00zUxbw5HbN7WwDYGG5jFBsj2JjDFgK2ALcFFFtAsAUOWwTYQtwWUmwhwRY6bDFgi3BbRLFFBFvksCWALcZtMcUWE2yxw/YE2BLcllBsCcGWOGzPbtuuya8fvDjLtAWBZgcrzRKk3oWW92XZ+9bIHMV2ES7tMpSpK8uYLhvfeS7OFarsM9zZh6h06Czrbtn6WaVSolRd4VLdodA+s5wZ4iRd/lQSvbRnYKSWO19wn5VqahisE0SqI5jYN5aNQzbC7RsdRUl5AWZoefdub5YelWhqeKsYI1g6ZiBzqixjARrh7WKMSEZkw5gqy1iCRnjLGCOSEdk0psoyirlR1CVvhbJYxvzOYc5nPx8/3f4B3GNwhn0LAAA=\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/shared-ui-styles/src/utils/utilityClasses.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/shared-ui-styles/src/utils/utilityClasses.css.ts.vanilla.css\",\"source\":\"Ll8xbDhqeHo2MCB7CiAgbGVmdDogMDsKICByaWdodDogMDsKICB0b3A6IDA7CiAgYm90dG9tOiAwOwogIHdpZHRoOiAxMDAlOwogIGhlaWdodDogMTAwJTsKfQouXzFsOGp4ejYxOm5vdCgjXCMpIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7Cn0KLl8xbDhqeHo2MyB7CiAgdG9wOiA1MCU7CiAgbGVmdDogNTAlOwogIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpOwp9Ci5fMWw4anh6NjQgewogIHRvcDogNTAlOwogIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTsKfQouXzFsOGp4ejY1IHsKICBsZWZ0OiA1MCU7CiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpOwp9Ci5fMWw4anh6NjY6bm90KCNcIykgewogIHBvc2l0aW9uOiBmaXhlZDsKfQouXzFsOGp4ejY4IHsKICBkaXNwbGF5OiBmbGV4OwogIGp1c3RpZnktY29udGVudDogY2VudGVyOwogIGFsaWduLWl0ZW1zOiBjZW50ZXI7Cn0KLl8xbDhqeHo2OSB7CiAgZGlzcGxheTogZmxleDsKICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwp9Ci5fMWw4anh6NmEgewogIG92ZXJmbG93OiBoaWRkZW47CiAgd2hpdGUtc3BhY2U6IG5vd3JhcDsKICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsKfQ==\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import "../../libs/waymark-client-lib/editor/components/panels/AudioControl/VoiceOverTab.css.ts.vanilla.css!=!../../../../../../node_modules/@vanilla-extract/webpack-plugin/virtualFileLoader/dist/vanilla-extract-webpack-plugin-virtualFileLoader.cjs.js?{\"fileName\":\"../../libs/waymark-client-lib/editor/components/panels/AudioControl/VoiceOverTab.css.ts.vanilla.css\",\"source\":\"#H4sIAAAAAAAAA6VT227bMAx9z1cQBQo0QGTYubVTsC8Z9kBbtKNVlgyJzmXD/n2QnDqO+9CHvQgUeUgeHlGZqsPl9zWHPwuAFn2jrYTNvrtAflj8XWRDuEjhs1Z8HKKHBcCRdHPk+13p0Bm8SiiNq94Pk3o5YM9uUm89aSdKx+xaCanMCNkkSOeCZu2sBE8GWZ9oAtnOIFgGZ3qm2JpdJ2GTP0fbUM0StsOFPdpQO9/KwTTI9CJ2+fMK4rmMGNdhpfkqowYAJx10qU1yHLVSZMc6qbHovOvIx/AtcTXJmWFV73Fgm2frsErnDMK61bYRdW+rAUkYSGgrXM9x+h8KGUXoCN/JB2EcqoQvq6LOcf/9iX1PTz/hQaVxpGI+UrINfcUzTITfpZJ39Dh4Av8n390j3zxbH9Ira8vkBZ3IcpBgnZ2uwv7rhXpNkMoZ5yWc0L8IYalJOyUU1dgbXj4s7ST3bbr/RT5s0gewSL8FivVDu2+fU8YYpljpvCIvPCrdBwnb4RcN3g+G4YjKncVmv4Siu0BwRqskB6ooYsq6db4Teot8Zn+yNpQcaHRjhWZqg4SKoqbR/asPrOurqJxlsiwhdFiRKInPFPd9pF4m6rOyY7T6rPFtgvX2QdzsdUdtdPSBvAhkqOLxUf8BAL6kcJQEAAA=\"}!../../../../../../node_modules/@vanilla-extract/webpack-plugin/extracted.js"
import { _dataAttribute as _f7e49 } from '@libs/shared-ui-styles/src/utils/dataAttribute';
export var ChangeSpeakerButton = 'dfsxzyb';
export var HelperText = 'dfsxzyc _1mvjjk18 _1mvjjk10';
export var SelectedSpeakerContainer = 'dfsxzya';
export var SpeakerSelectInput = 'dfsxzy6';
export var SpeakersLoader = 'dfsxzy4';
export var VOForm = 'dfsxzy5';
export var VOFormContainer = 'dfsxzy3';
export var VOGenerateButton = 'dfsxzy8';
export var VOGenerationErrorMessage = 'dfsxzy7 _1mvjjk1b _1mvjjk10';
export var VOPreview = 'dfsxzy0';
export var VOPreviewLoader = 'dfsxzy1';
export var VOScriptTips = 'dfsxzy2';
export var VOUploadButton = 'dfsxzy9';
export var dataSpeakersLoading = _f7e49(['data-speakers-loading-fbc1f0a6']);