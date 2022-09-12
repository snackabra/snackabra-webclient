import * as React from "react"
import config from "../config";
import { areKeysSame, deriveKey, encrypt, extractPubKey, generateKeys, importKey, sign, verify } from "../utils/crypto";
import { decrypt, onlyUnique } from "../utils/utils";
import RoomContext from "./RoomContext";
import NotificationContext from "./NotificationContext";
import { SBImage, restrictPhoto, getFileData, saveImage } from "../utils/ImageProcessor";
import { uniqBy, remove } from "lodash";

const ActiveChatContext = React.createContext(undefined);
let currentWebSocket, roomId, keys = {}, roomReady = false;

const spinnerB64 = `data:application/octet-stream;base64,UklGRmQ4AABXRUJQVlA4WAoAAAASAAAA8QEA8QEAQU5JTQYAAAD/////AABBTk1GagUAAAAAAAAAAPEBAPEBAEIAAAJWUDggUgUAABBUAJ0BKvIB8gE+USiTRyOioaEgkOgwcAoJaW7hd2Efh6prNbO1D/gAFtTkDLJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMlvlnkDLJkyZMmTJkyZMeSWEeelzQErVKB1UoERL4kL1X/mx4WBSyZMmTJkyZMmTJZdsrcxqBlyDuGqDm2Y11hTpRkk31L1igsJ7NlEYr6b+eQa6Pg0aNGjRoz9NDH4bSkDVrBErA1exr5OhlBtW5ayEEIJ/UZOE2Be9yYGTGHDhw4cOHDhw4aCnIMLNzrbV0N3wUMNEowrOy8UgbzrXUNbGJlnaTJkyZMmTJkyZMeUJt4aYyP+rlfLRIdRIeT2coabZprQzidmiMfaOQMsmTJkyZMmTHmiwvrb5sP39xSDRCUhOzkt5scB82EPm1oMudZrLYYdwdnJCDwMPg0aNGjRo0aNGjP1S/YUyB9eXNV+JBqoqje/rXqeMiBj+v+4gQIECBAgQIECBAcM0QvU0qTqF3N8g10fBo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNF4AAD+//CvAAAAAAAAAAAAEBjmdNCCHeZ+O/nx41R500SsMNvtmd6jpvSfAD0kBXxM6mh/2UJOAABdO4ZMZvd34xoGAJXtLsKJjy1eedXdi7K2KAEbjXyw+3Ch1y+HSiy1aSEdEScE4CJu0S6NJUicVDdSafe5lNdxXAACrJywT7+Y9z+ECJY/hbNyCFMyal8pNXoTMZABpWRRRPwsoDwz6/RaFro/fb6W+4fxBB22rESs+aMXu/YUx/u/kCMkzediLVscYfg7V20WDkNB96y5egq4+J4rRgG6o//fXLbK7WByi7JESoADyciJhOgIJp0YiNrncOPuV3Ev4PoBUPeuFvEW6vzG9g8UlC+O2MHxq7gWkwIoX9+lflnQBi2X4g1sd876mUrxNpFpGDFnFNuwq91xPLZO5BHrkZeXNyVe6N3zIcV4uua2StgySTmVkA3zAHDX0avU12rRI+QOMa9DzyZ3IV5OhPyZlOTM3pFwJhAQMUYasTZgQYwOpm1CHsClgoSO5chlBFg5WxmWxtct/qB70VbuAHPV/8/OOa4ncbf+PHjCoX+jeMGO07Pe7VEADPrfi+0/CDEKYVKZABpsP8aWoOcR1/M3GhT0Ndkyhicn6/xhN/puMkoSl/tddDNFGfEc4I/ejs0Wn/Y84gOO2D4BACbOEdhje7/ZmIMGyDYcngaFdliRssOQgvaOfOegkFAof2+RDd3uwVpcrCKLHeHeUqu0SCd6Ew5pvCKgEtJyjXYe4LsHMm6fxpp62p9uY32QSmrTe8BeJiX8CHmEjnpiIScuyI06LPgP9kqJxdxrCHpAY/cPinHcpAaP5Ap5aSgi0WqFQGk42oMmojEBJxpQaRB4USnBG4DPFTMDDwi7e53YvraCm64K13KfQAAAAAAAAAAAAAAAAEFOTUagBAAAXgAAXwAAegAAeAAAQwAAAEFMUEhSAAAAAQ8w/xERwmkjSZJUbGH572V6kPvdHarDEf2fAH89fmuCxWITttlNFL8d5K+zGmYVtUlYpdr8BWFUgzYJWiah2hdd5GvxfVAp4xL82LCqDPPXAVZQOCAuBAAAFB4AnQEqewB5AD5RII5EAvkptgAAoJaQDU0EfZuXximnSQYKmxz9M1yR9KYoxq+9v/nnAwWWtGGifadBEMaQNT7GfAdfyJXwnNQY3IL4QKKs3YeP4xaX+aE+VDZTMtmM5JMVDPIgCXdowQE23r77RpwDbLCzkkf8ySq0+cn4IZ+7R3dBGLsY9NtLst1rxDR3WuKJwxPcD+N3/IvVqbM5M+Sr0wfxT2gnXLt5J/fvVwVRxO7c+BXN1nnXZ2ohqqlyIbLE125QB0acj47Kjnu1pvUm9kg0Gu9B/gjDhYVfUSDA5D9mAQ+gA3DxJC+dELqKw5GllWdP8NsYAP79qQ05ydlinS0U9gwp2L5guMCKU82ialSRr87kggmWN2Jh0ZpySsm8jAIgolxBe4YOil1eFTMQGbPgf7b7UBvmX1I1Ivgqm/5TzazEsj0Vz3BqhrivWllfWxalkmm67AifV/DHU6fcXf+FUK6hhfgkPRftwTxyqJKbGpF9YqzyYrztKYok2jxMqc2n4wq2wrHq+YVA3MPyXz2XBN7Ehg6zCnylSTV/e/yS106uLwbNrhJc4ryQKlxqAcLus1sUfp2vjbwEGRQdNjocO7Px4D155vw6Ru1GfX1jJgg32/+9IAjcK1P0JnOt2WEHwVGq4oa9I9yk0hgoxU0UT8OPPtJVD6xGnRbo+w4RozuTOUo+u9Rdou/wfgGAD8MxvRx/5WWQTXINOwmCHlOVVQzA70VlzZQW4IeRbrXDM09Hrjt14o1mR+5XybvAqFDIRaKjTEMASGBvxvwg0IfQM40WY8JuDbZDz6x7HOCiMEZ0kJzsD5N4pV8zFH35mg+wsXAXPEn8FedDM4pSzpeCFIj+loDkQSkL+iDysl08f3yVpqZOrS2NkOtiQedJuRm8m0jnvbu8luNeQUzo3sqNRZkYt5hfbbh14Ec/fn8QDSfyMAxEgxA3eK5+DAO93wRyikR9p/Cv6FbBASip2at9thM/FP6w3ZP27YPk+BET81ItBx4c6mBO7GlXxyPsOs2PHv1w20NiCsCE9VhAbm07R+pKJ6yE+1amhMMSJ8V+e+aaf0PbzN5rmRBSDLu+sBUeOxq5POTFqDo+TZoD2u/JqB5AQ+emWrxDBjGVIEEYeGrhSe8OnZ2CAIGgfLEuZ/9um6K3M1hIQ8qKh7ctk5x4EUji9/LjXdvcgpOl/NKFjSZhHMFJbYi88Elg5mVUBKgKQijGl0ojZOOyMkJfVBd63bJft7aySVEWqJ0vWPmrpMSy73Vghk9RxvRpQhN4Wf7IyT7lBVsdpHS6EcUrn1h/sVnR/gQ84NAH1UiUCAZYHuAAa99j9p+lZmMlIXVCCisuzjdMNILNkKgnJEnjMgG/nrnsmewoK1nBUGwv5m6W1BCUUr2fALhrbvZavjdFM5dZbmpwZAAAAABBTk1GugQAAF8AAF8AAHYAAHgAAEMAAABBTFBIWwAAAAEPMP8REcKRGkmOlJDfHvPxhBhvdjfZa0T/J4Cb8y1LwcHB0tAJd4nDaRduznWs1LEClhTAQxEAax9g/occsKSANTTZWwr7uc3FJo5z4nRROLeGKgpOIW7OvwwAVlA4ID4EAADUHgCdASp3AHkAPk0gjkQDD0SvAACYlpANQZv3HvXay3lEmFIGoIp0ipyQ+SaXbiVJ9x+jjR0By/qI/uNCUg/H75MFyycTU42tKlRKzRc6gDQaTrnUGiqA1wum53kOZDmWW/hQPw1TyFSoTspw68ID9Tksz7lAiJXcoVUcbH6eE6ch1eNHJVHKgnW+K0xJqKKTGh5DJ+EdKSzWl0My5ccTSiZe6tYzrCdzKy9/aw/XoCjAVaQ9b+jPUwU7pIoye0tIiQibswUX3ErpEF+CFAnyMLuDZ4arcF1uTnZjrKWIrdnh4LslRRSmM4nyj6QK2RQWYIbph3YF8wMJKsO3IwAA/v2pC/dPbzW5++MtOUAoj7xhMdQGcQ/ecC8sBppQmjj1+R8P/VAADFp7VPnlu+wVtHlgsfM9LJC395pOalwCMDgoOpFRpMt+pwpRy0sqsZxc1wFF4/nwnoeUIHBDRo7r5+4ABppekmOwEaHJFEs3C7Uwk0wBJRYtBTo+VhPyU6E1AGry+OZTLhjpQTe7azYGg0aW7TVm1pvp5AMtu3vvKp92AyTD8NX8GEMdw0rKjc+1+pGJty1i8cd2Frs/PDkdX4BltxmSElJsGky2Lh4RaXCZlUm6iGGz/YHTJeuxTg4TVSsSBCozZHmNk7iZs6O/uCXzwgJt540ISLkXVBGQA7wKH6AFxPd6QhYCTl1Kg2oO1lx0v6XBlr2HWOJfLiFpg4Dw853F12Cl9ZNG3Rwg6/3Q7NP/LbjIYWx/GyqOjhM4F76Iyi16VmGiZa0eITp3ClprKwdnAZDXN9FCkGbcDgeoZdjtZXWfwqDTACOgAGUTMYN+lv9gtrZxamrd4zY/13OI03yjc0YEVEBrlWec+oC3jgWyAEdiT9q0WUwK4yJmUXgjP1SgRE5/i+stWf8urnsGbR8bCR0eH92dMwSSqFWoE7bwVSzAaIBc0nw/7W0h7by+LzbS6q6vY0/Ta4lUEonfUrDyjvkOXTndHeQmQxYWbsstuTIaePMuewX6HPbvbf+KZG5zJ4t2AUeV5eC9RrqGUcQL7L/1gxr8oe2hWUuLMszNQ8mRdjLHL2rNyCG8QXNxiqlvZ0+E3+u2PT/YIz6nmEyL/XhOwcf1M7BzRrFtth2CjXe/ABEMP77sdDlr+7b66VfKui0/Rl9p+MOuKpHn8jUEvrghHcaZu0DJTAt+/7ssdqAHG3rZ5rTFe9rhNIMYLDl1/8Bsmmd6Lpm5/Ozpc/t35LJ86BIGRs8zcbnhzGsvRloOvEOFbu9DupTBYb413WsWUuyOW7MFadl3/y59k6FAIASUT4MpUwRlX2LCbQF4xf2SusRIc+lp1I1SXsx3FveT4+By7XMwXggy7jhxr1DJDViCZhObBXB+yIDn4HEewx9tGCwQ4m9wrOWMbVpMxNu9Kj06ginWelGQosVz30XxYIbQAAAAAABBTk1GpgQAAF8AAGAAAHMAAHUAAEIAAABBTFBIVAAAAAEPMP8REcKRGkmOFJDXMf//a0KON7ub7DWi/xOQm3MRgQXgCIYykaM6uTnXEa4jfIDbJIngjxJOdCSGJs6FZO4i57yLnL0sd4EDOYKhjVwoN+efAlZQOCAyBAAAFCAAnQEqdAB2AD5NII1EAw88u4AAmJaQDSeEU/8j23/52ve4N5nBSMwv+p+/pkyGTk4mjsGxvePeX71frwgKfW8SyIlOfLbOIkOO+5BmYiGBLpmmO3BMg0fdL19aRUDeAKpYEm1Q3hZksgSWLtabTmTs25EryWydkVEmx6I93wdGPBNkjHm5tgnTH63cSXaB6Idr/ozaHDyBYTD34ixyK0gMz9bi8B2fNweuZX+tSvfG/ustXNQT+yf0iAG6re2n6oFXLwbitmvMU0kw9pjD6oczdq2R8QU0WOYe6vCp/CgTz6BqdbAScNNxy+kjQZ1ZB552/kkMCsSAGqrT9JhRUQm3QOYUbo4XgAD+/f3tN43z3/RLzxQy0OZLBxioPrfE8USSz7GQhqAGzZeoRGPWUy7/IFZF2JNpRLVcQWDJDuV7ULYU9RNEiUJbX2cGL83tUnkq1lQ6eUoXmDkFpkMiv2naYyP25ui0EA9qTSDUb17k8dS/PCeRaaADs9HESOAJjEHP1TAKYK8rb+Ywbqiz5h7cJFO6XgmTVUfniGJ2nj2RLvyKVcebqiPZWreu7h/6efuS98Uro3PZsOiWOTmWIDilbicjUkSwipEZfatqyvzfEEehXKWOauq/jzRDwS+ltKZTtbdeCPUieZi5YthbUsDKdA156WAMAEIRQfTaNk6hFF2LEygBRjSwtFLR0W1lD0NLhTvtUrWNeB6XyMBXLREZzrhIj1cfBgIr8uC7FGlkWYmRJeIuWR8obiaCDLaxgE2b9S00A4fTAmL8wZ4vaf+zXrj/vdB6AHhqdWVvSIHgAEu97iYwjvyzewsbqXfyEvUfdF3RE4woOCHVSfQYQFnBhBE1WrTOxwq6Zbb4t+IRswZGCuP1KPFjR1mcoIjXq/YXUQeLk6+AgUmsFkhZXEhNc0nhIbJHD6H0SlwkqhGaIwKfUPJ/EgfhznPmACetd2vuCjY2Ouka7NnkShTawIO1tWIv/AhLuzEyJRtB96oRaDw39Gtw8QTVK60yulpGFwIMnVPbsz2SMwonSHlykxgLFLVdsTyvtx7aeybD6IZlKbZw3UNibfSXQFR0/iKITOI8UOJe69OgYSb7DFFWuowvP8mbWP+3T3Jm4vaxCSQAAMss4R+e3vI/qyLuZ+piRN01IxxQ/tNlRQJeP2ndJho76uX08S+nXLj9D/CSP9tJnh8JWedtD8xo76J/hgojeoogXUIKcBQt819/VmRDGxurW2CqhMlxR1F3xQ/16ebo7YtA89CPji3tCApgvh3HB37+VFjF6OOwSA0IP/PPQzwU0FXqchUGgH5w8BMmOo7omZ/8xzc/pSJh+q7Lby258ghx0mw6md0rMeoTGMStd87JK7rRHAKL2ttl1qxna5QgZHJ183EUBcn2A0ekCSiy3/kpKrAe7fTikQZAnmAAAAAAQU5NRmQEAABfAABfAAB2AAB1AABDAAAAQUxQSFgAAAABDzD/ERHClSLZTjUw2zZsfKDN+sLgb0T/J4Cb8y1LwcHB0vCWjtuEy3MRDq3UcQBLCuChCIC1DzC/JCwpYA1FHAAr7Oci3GziOCdOF4Vza6ii4BTi5vxlVlA4IOwDAAB0HgCdASp3AHYAPlEgjkSC8RG4gACglpANNlwvIBHzr8WE7W3XH1XIYkcE3NsO3OO7z631nl9LTbkeQKM/Wyzv6YfCn64GTp8+Cf5OAFErc05RWwslCeDfsjA2dcEAdDYcUVeUh03yW1NW+o9kox/r0f0sv++LlMgfmvOYnfw7tSEtGuoYUbNfwy9tV0hDe27wUs7IHTDw6imz/nGoxMTKHEZQ6w8C2GkXa1nhuZS6WIynWKiOj5/yGHKpm0dHqh54F48iCfePJZv/zSZ08rw7/psBEtFiIJ4Rc648HVlecK0kc895i/nGrkaAV3DPeQIcrd/hbDzWOgh1YAAA/v2pCrqTtE1yvVKVmOtgj0fBdwuVqDm62oBvaHMW9nWTtqOIMAAPnu1MDTOUewLqzcJSBUPNM2nFZI/dXV6JNImf/vx3j9XBl6BpLKDrmt8xBO3NCZoQVT2nlTiM1tIbqVCxO3h51xnkvnHRFnHrDJJu/8/d1A9//QBzTJ6DdFWuVJPT5MKO3pDO9DOXcX56sw0VaG7tLmJgkJPxy02EcXtpCDRIBIkU8F6cgCxobV9U7lgX33bpJz3dGbIoFrfvMSj3fOJk/gLbZ8+DjFiIlAt9ONB+doRYU1Vlp/67cmhkYjUtIaSf4jei62ELDfs2SlYn8LxjdbZjkH7kC53roddKJzhhhAGb1e/kP3t8FasJOUJxHGY6OSiPrN5PL6H1fVQWzHvFC6Kxxgfu3/KvwVJliFlJz6c3wkGrTNl5+oaN1CjV52oWud/5Gt7w5C9vj/2Frqccrstb5SmJt8r9+4agrg5k6UCqPNlEKwww+9D5BNBNPsL4VKDUL27C5njY92ufHBPTCIC7uErOf/q2h0Oq1KU91G/EGqlrLe5C2eASw4VEPA+XFc76wtf1P7POgBVwBCOM6Ccy8Or/PVVU+3IQXh70Y83YrnPXDYFCTA+59omxywvh1JB07LjgxzI/PFKxomUoPbb35uIdlO1nRand1kfeYs9yvD/+Dxf84C1Xz1rggjebZ+MHt+JSo9RPj6Up3VGTN3rfMxghnd/fZpZ0Pnr8EByIZxJEKHPoout4xI/3ZrVNPZeIkDQ0R77uXYRisPr6Q3LFCBCP+0uk8OMyLrq6FxoZON9U54j7pkYSNtuY6uSkM9zk2KSKhkX6adANW1mlrhwB5JrWbGE4hKUAD35EZVNIIKpCcJa9eXiO//0TuArJp1i9PRJHSofD9O7absp3E1U7iOTJ/7Dl3W02I8bows/Y3tCxN3ANUWVbdT3SXtkY2BwnIAD+tLIL4W1+KY15rWSv070I5wOKGQKmAIwY4KYP6osLtMwAAEFOTUa+BAAAXwAAXwAAdAAAdgAAQwAAAEFMUEheAAAAAQ8w/xERwnEiSY5UUG6s8N/Hglwt7q64b0T/J4Cb8y1LwcGKpaFKOAiNTl2Fiw7Mdaywb+IAlhTAQxEAax9g/oMcwJIC1lCEQyvs5zrnTRznxOmicG4NbZxC3Jy/C1ZQOCBABAAAdB8AnQEqdQB3AD5RIo5EAvkxsgAAoJaQDT34gZAee8nk7e5mIPQuAweOveT5VSbf9VxAeKW9iFeQMTrdsGBDmy3VbX1it6hb05ODw0IgW92Bln2lnblFMZxVzzDzyDadLuuv2+WMvtmSpqGf+6MCADhorvCXgqdt9W6EJrDRXg3sBDZdeZ6Kk0Md3QVQ0bdbr41TvoMTdMts1/gIuscICErrxWUzbs/aSD67vVnO9VKTQsPsUeLOBu3Ajt7sRurmoKXqNfklneYMOnOO5HmXdvwbMOuYoN4rtZ0NrO7nwUiD0dbchwcvb6uavrrwY2YsR/l07Mvg8py/5RyOSku1phuMNIAA/v2pC41YGxquORPnJaFJYTw4n2yjErTaK87+ymYshlR3A7Zh54x+K+mcM7xELi/tDpBjIFWvI8uYVr7N3Ksi7jd0KcFVgVBjTv+dBPVR9x+itAUL/cmpAwLDVfL7FBX/tZDrkyXqU9u7ay5iwcqSwHONwkkqVCDRluYOAlFvLcRR6fqsSOD4IaEYJBBVQF5dhLtoA9UTa9vx/sLwMvMwkL1is7pPLO8a4i5oBfk0wiKKcfzJ6AT9FB2t6Cxcsn+qEgdAW5izLEbuBfs/gr1w+KanTvpTf5YMw9/2g0u50udOJ2APjk5b4NI62li194FOXuXcUg176K5zCWT67IEpuJObqL0rIUFvBsvYj2GcYvtuhkoACarEjYqm4QYqACmo30Bh13WGoT02JXyZYud/8OHZivRy10fHN4C6zl1Df1DdURQAO7uUCix3HLlAskv9i8Qt8irfCwQrjCBsOsRTkY5oGwiSUy+L/dqFB7sf8sKKlv8AzBc8wOwsu4IdiUlRivJfqKW7f7LX6jcN0t6+a8oRmOdLu4FODHvzTPxLpV/wp9D75DGBBjAFIhabfSgtry0elJrGfB8/HW9UMA2cSpeqh8uwCp8CgF93kTqhHzj9QtYQr2s2+61MHiJbOYPS8Je1aHNlcZcX1Eieuq0jabTXfdzB/N6w9CB19A1sinEd43+wPdGslYYZNLHihdQ3/TYcCDENgR//t3llMfC5A/lbkmXfnGfz33DEl5Dmt0da9cNAp7+o8H60aJx4MdXHKQ5PDJM1cZX2lnOGCzpB4pdse5m10YiKFN0mOYhwiJ0K/jVAHHv8vw1mK/q4p/M9twN7cUo1H4D/O+hNU8vCaA6eVXjbr78j4pIjjvETloHjKYqiLmJB+o9xddL1j7lhegusTm8AdS6BvYRQUeD1DIVCnAFK62w9DmMB/rPshgl6uCNG9bsbcINDG0uWXmpeRilKfKC2wrFNQVt1R3Gd1yZByNsaJQ1IDDn40n0AL+pqPnAaujpAuETC5A6LHBNQY3SKXdBqrt01cMEjQYAvaH7SC7ib69ViJ0QMXQc7mbSCuCZ8Add6fE2csLaRVPhD1r6gVGVp7EAAAABBTk1GjgQAAGIAAGAAAG4AAHAAAEIAAABBTFBIVgAAAAEPMP8REYJNG0mSikFRXQZLuRn0/dno0oj+T0C/7wkkN4mw/kjfJd1jSHofwbQCpHWNQOQ1e5TUIdIKpJU1QSWV9L5HeDdTmKcKawJ5MK1zmJvM0O8bVlA4IBgEAAA0HQCdASpvAHEAPlEgjkSCyQzWgACglpANKzht/j/s46f32A0TdqWokuitmHEWywFZNdiilfDHCOkNh0lqwBO7YR6FCq0s/UazR5DrMHupUzTWEFwJ+VSWGWA1qhabhGeaevZZQ26f9eWLFwH5r/NDmzveLH2N+74xmoZV5Qs5UNyzeNzgJbj8Bg7d+xSa98Xtu86P/vg9cyog563Dc9NnFBehDAAnHhvpWlMR+MRMwznOI4jfQ9HSUozSfnb9/3t9XTOjlnf0D65S4F3xSN4umQCE4zgm4zDIvcxJ+QISWBbOnwNqkaHYaHEWH8H50RBbAAD+/ake2IT/O+t0wjtoofZF4M5IwQxN4n4+4KSI7lN/XOnACHrPDjlinyvNFG0joO+rnn7Gf8T/Ki//xzXxeWvDqrjuo/v/TEzur74NN/ovJx/228hD8YRYq+7uAw8wtfObFFzOZgoV8QwAAqCx78k90mCu9f8S9cS4zVKtnyp4DBj5TOYb0CKUA1oJnsw5t4Qf5KojGRNwb4SNnQsO3TDYYUhmxJqoa1cVMrPKZyOTs4brJHZCq70f9IWfsPFIRFc5nCqhw9cVtOarK8NdrUmTnf7Agvp7kXyIHeyAjqlk332VVsw7P8C9ZvBE2I80ffmOI4w/cdV2C0QYUyAI08+Ei97YxO8Ox3tMTJRgEOHg4Mm4JAnY0T1xSvYPNCDAGdGxn4PgNv4DRSxyot1yKtkBhiPjvFDacAF4xfhRwPbsfPBpnf2yigLLLjUAMFWjh0uWEbrFt8vYIW2yfl3Wtv/un79hPICejtXdFSkOP1O4iHSskN+xMe8j6hoR6oWn6g7SKyO5X8nuyKJjiW4YwPkvPC/95ocUnI8DBbi6Z1usMtCso5kX0j9UPmsOCY76BYXYcG3y7L1BuByzeCz+aKj6vw4FxGCY5tZt1fSSHkKbnopHmajBCk7B6BuuxJEYT4C347tO0sss6Kre0IWfrmDO6KEmYTvTMZwaatxkL3XRm9uHmvbh2q5GM4w8ahbDDyS/TOOjZIGCiCgCpIYyRm052Sxdx4aN5gpcngbjPpgGQuXZn+HPhznK64BR6mIaezagQ1cAh1nyPXyY2wA/tTGxc3na9KgX4UlYWriuJ6643XBempGVy1facBXtINOY27wPYdj+F+9zk4FS0fXcBP/zbN9B6OFZ4q3aJ3vVk0mpN/pOCMjDrL+DkUftWDhq1MY18jJWuGM7wGPEF+H0Ne3op82t2RPKwotEfx6LwDQEeY0U77dcva7xDRpNEHm4jXBlBIAl0qztmJ4/4jvzq2R8dJuemuD9rJb0Cn6nUON9DDO6HyGm67rIotQrZcf0NgZhAzXDQwcbncK4bs1hSszs5USrX+itt4RwG3zwaM9Nc/4AAAAAQU5NRlIEAABeAABfAAB2AAB0AABDAAAAQUxQSF8AAAABDzD/ERGCUQC3bcRAVMPAlMXgHt1D/4j+TwAX55Kl4OBgaVUJB7iMwr5VhbMOU8cK2yYOYEkBvIoAWNsAU8ppYgUsKWCtIuxaYTt1jrs4B5ZWEStsHXAfZ2NV4eI8BQBWUDgg0gMAAFQeAJ0BKncAdQA+TSCMRANXU4wAAJiWkA06RHrqScM5db2NcjK7loxaZQfLYnBU8dCTbHyX09IBAXmWKTToQEhqN9dpIeIiq+vLIATa7Hg7KPktVVeVBJTd4qPTQGGdupckptELxFFcNacbt/NguGLUKcjY9qcq7+G+Ri7meayrMLorMRmrZCzsJFrc/2RmfphXt+NgjJEk/FKx/MFiuwUUX3JMpskdFRHNeqQ1vRu4J92vCBCgic9AgLXYPt6Oho6ZPc88xLQc4Hg6RbUG/p1J4wLzzDsPfozS1FaIP8cV9LUafbTDAE9Jicd22TfdPFB03/7fHUaNlZAAAP79YCH0YzEqeF4pJxRDYwE85SDhsA4Xcr1N1y+OjfpMzJ90/X8CQbxCd/jw6J3gJgBbcS8ChHj0HJDW+Eu+yNzh7BN0ULiSXooIS3Gd1U+Fec4SJ99Px/hCBFl6xlteQn2wAqKTYtwABhd+o6nQ7D0iEp5eLd/JHqysd5RxzekVttKQouDA14K78zJjP1I4R14AwAki8zlDo0Jf4j5WUnPWOAoxW5TqFxc3JhQ9o2NI2gSzFDZw9HIxYOH6CmpRhI4lSnzrmYUQG3Zutj/yn6Ynf6oxAGRxPRrE1nhy0XBJC1EmsF8qDxinc8hq+eG922NrJuY5QJeKeJELe37y6lVGlGdYnKf848ttBdqnkO46NioIFEyUMnUnwnSpLY4MKgpAz/w849L5XFvp/FcXy9nSC/EW21tQvtiOohCcM/SqpR2wMb8X5U/zxjE8xgQjVcY8p+G8lA/B1gXdzqrihtyl9nMDsZ5qC6u48DYk2Jbo+A7ar6HORRhOHfHD9Wk/MM/3qhtRQj7it6x3Pfz2P5JvwXi/ijwmvGu85JyJMoHhKI3QqVTkKpQZcQ33gAzMijYaNmpP3yjWNMTVPJ0p/RFbcFXfx23CIA+Jnc/zdwzjsbCokQTNmEOhiO4XMf0nGFiuNIFwagUhn0/KJXsVYgShbNEynnKWM8mf8EE57uIoiLaB6YfWBGFGufexEPnyMc1OdQ4fkYYWbRWBPgu8tMmBO0QBDphXZ6kdyOxVNtNAmzNP8brQooeMOpI79unEggfSwt0JgQK5FfDXiDeplerCK+xhBvPO/UD+iDisdrQSysYGRE2pIEIeWftg+QHgeQf7XQ/WGrURqhIwKB5PO/v2zlxb32mcCItYAaFbTqCxycgCFIrcSCpImYwCsZBNmDL5XsnSJnyuJ0ebzmMLY5e5HRZV43ZkAFZZNwaTGk99a4ADK69AHzbA+phxlImDPuN2ykEAAEFOTUZyBAAAXgAAXgAAeAAAdgAAQwAAAEFMUEhVAAAAAQ8w/xERwlEjSY5UiyD5sywGed6X7hvR/wnw2ePzSCqVStJVeiWj6l0yyWd3ka6iV+QGHaRKrqv6j1ElSZV00U1Sb856cBK9Q+kgkhtUySw6zGc/AABWUDgg/AMAADQgAJ0BKnkAdwA+USCNRAMXFrkAAKCWkA1BuHf+ukdC+L7MH2F1QCdnywTAGQY1XGHJev1tJh0wo3natBAP7p2S9o7eCmvj9THHRUOV2nbqg2gY6DJbT4X8mTgu82kkYyU6311v08J37Nf0FYz3wXB8revcjAlUXEEJZzWAeEGM6f3T1/sM+ATaPxBFDzyODKW71LCOzvw8FMr1zd12F9jP5WQbPMpXkNLd0rlbgckA1clutGv4Ne4Z5GYfLpAKyMaTOzRnE7cNUq17Ibo6EUHi+jyXZ97aJR0oFVcMq3IZI0BoDJIEujZ7BBtAEGswbTqzYn/xXVppCDSTJvXiPELST4y1REVRs/5AAP79/ekPWWnw18Tc8b+wOIVNct4PqxR7ZTeRn/ThlWsl89yhLuHvYroOdGoX++Y8DgF8WKcz4rLa+1M3dSyQSdvsW2HpLebB0fUet0+NVguffxSwuiNH9Rtn+1YQLsN6mX84DCDLnIqL3xDIxy9AyU4vKKJQvrO+WqO6gSYyvkpXUTmfK8+CMcCEgwpvIvpfvrgm0Nwhkn4+M4k45Pzm5cOQUSx3wYAMFOkSEWRpyGuU6g6Zi381bgYR8ys+NxTetQGChB4XqtrauRpIO7Ip1mgef8AZAz1IrmWbiKX2cSD+zf3eUopS2uUxndtDlQiCXjWxlDmgKs5sTTtZG9DDPkepEFnV8rl3BBwmhqY8d6HxUeUI8eRGy2awdS6Tuv7J0NszfsIUYEXDzhkK/dlgGJ2jgwFI1z9S4S+SI9tygW2ZILLeh25z2wWy42xg2kSqp4kXryNo9s8G0I4zMk67YbPv6qfkMNYZyB33/gn+wH0Ew6xxgy857+y2SOsAbJjrRJ8XfNNQAhB2HB6hQ7Fi6aI2OO1WInnt3V1M+IcCJ5nJh6i7/8DSiFlOQcpn1G5xODA0hVfkyM79Y9ABGiisS6H5N2oMO7N7Yt1VoT7vX52Xwwsobnui+QbRphgSivzm6Ev0XHTpSlXvGstd73XjEWMzVQhvz7cIFhCls6jQvuMFL3BNKUew6sRJ81fN34ZVt22gcLsMKUaE9M3Dlg6ot3/qWUadKG2mrMXUbB864BjQE6hiF8QNGCs6tfuOqJoxiVOI7GYIzbphxEvETjMa+kzHKmF1mrzDMwa0T57boO7vlCGz7b97Ue0LL7mmykgPbZNeYXgryYgMZvupP2IWxaC8THmcZsDZCkHJ9mnRw4YABBjVuMC2YBOgzKGfqgZDvFMgCzaUoPIwXEW9sCQPdWX4DgDAQfcwMsQNaMdJ2AGmqnAHB2W4vlVsc3MFZzZl8Xb9Pi7BF5jawvwQcZzIBo2n5A2YznxJJ6BVXA3jMAAAAEFOTUaQBAAAXwAAXgAAdQAAdQAAQgAAAEFMUEheAAAAAQ8w/xERwnEiSY5UkG6t8N+ngtw9rZr7RvR/Anxy/zCSSq9IlmlUqsxSbtxkEp/c56HjkKokVVkGUSXXVfd/iCq3yDLJTZKq7uPcn4TSO3SW5AZVskxDJR3GJ/enAFZQOCASBAAA9CAAnQEqdgB2AD5NII5EAzcunoAAmJaQDTHsU5kf1WStcbx10C71Got/wDAyvmBESg4jHJLNjUGhVU51yRGSwKlMBl/oNSMxcurPh/tZVZvqeeHJ20eq/zamgMFh64/ZecbmgHds527GslrpLPZj1HkbC0o+62ZviABJwAz97a0NAaR9L9oMZL//+Ln5FopJ/j5cC3TOoW0ICV/4z98gwKEpBkx+EAu07cgWokVUPuj+oa4ByFSR+Jx6r2z0W6mOc+Xwz1HoDUjRepfUmNV7PX5/JEqFBq3ENIefbpUIwGLuf9/wHNbSOUj25Rsl86VbPtuAo3TpzQT28SVD5R0pxSl9rb2iQw9s7dFCmMb/sAAA/v2pCg6mcZ3sx/BwZG2CyL9Bt+4Qo2lYzdPLdyxTrtvDaLOlVGIeJ5kuPetsOge/WUyGKC5o0qZxdwkB4ca8UI7F4Mr6QAFvoXqvYye78QKdBCXu+0Yqbz+QuAsH1pul5j4UReNHrld/84Tpbz0ExPjcMKi/t7rCsQ42ZDvXYX/gHcLoBx9bGWADMR2yIjOAmJDvUoBD9TKqP+BkjV5N+gWo+7xJUGTwxK8dFHwAB74eox5U679aCR0P1vVMzy0clNd/H/usmPnZuOA7QcEeyzJ6vkzkhb/fZ+KR4nANT1W7c6faCIaWbOFHlNPkHk4YYCfOP6jxHu5Y28Rz4RoPnbDeAwq2MIo/4LyZGaGqXnelGgcU4YYJNbDNRHULFptY7bEtPRFqi/cq+ovdLNc+J17Xr3uSTQ/VDjmvPy34YKy1bMu7GAIrr6AaLD8hj1E0R+iH/JqJoAt16s9BTLsNsbwktbDkLdMqX9iWkkeMTH/WldJaZ3k8VTZiujVW+B8ThUtktKfPvoEl9Q4SO+AkRzl+2v6LwVH9dV0OuwtuP8qseXcJvjrDawHSkL/mP5sU11fpIw1UzGZuOugy55pWdGaAi6OxXCqWfE64Q7ua5eiKF6chTPCFRTCoQrupFC6FNK+cPseE3E62t34mah9AbNmTB5A5S/VpNBEdsscaEZoK8wDjLXXkCykdNApUxY8sDgMRliK1A8tUVzVUPKVXpljivkE2WSyNmgHmsZue3XwZU+T+A5u/IpPWH81V2QGIWloHtXEAkUjiEiv4TZkPUbf21eOq/CKwExjCUOUO6k/qYyNmPk958rsxL3AvuRkMH2RcDJGiwomqkGNdS1j4kIQ8cRKQwstvOPi08P11fDSCK1K/8os2EtmEdTvqibaQbLk/hdNY7BFmQ1p3EQxyI7vf+GqQ1GyHvELzAogTkThgKvfFMt2w40FzIAmuKj+CnhKHkg0AYIv9ByzxKnbnBH5C7GRKQ1XUrK9hEgg3BZrSj3sAEyiBZlxbgU3MhAAAAEFOTUa8BAAAXwAAXwAAdAAAdgAAQwAAAEFMUEhgAAAAAQ8w/xERgnHbNpIMuI2Z3f57NKDH3of/Ef2fAC6ul6xtwLE0ugTAAVfalglbh+1ahF2rjwNYUgCPIgDWNsBaBjeyjoM1mgTAUgDWIlxs4jgbB6eLdIQ12jgbqwoX128BVlA4IDwEAAB0HgCdASp1AHcAPk0gjkQDJzCqgACYlpANI7h9kBlmyXNHOre76Ht+wVZxrdbSC+cR/T76cHrvRaxi2ncvltTJ+jjOdJAQaQFmTPa2Au8bzm3g4j89vzKLYBroD+EiO3Kb3eoQyHHXqbUys5vud/RdVFkxWX1d+QOnN7HmAMEzPmwEFnmJ008j+h1IoCgdforialD856I3ChNLM2SAZoCian/unIYp0ogTU1rqom7qkfTUXY84zkK/oNScrWBpiyBwUF3618Qv2yfDaT11lGBgoGzxR8TXABXxpGU2gBrzWttAJBdIauMGs82A9kkhjHMV3yUIaZjpgFNGHQAA/v2pCP/Ru5gT9icBTYjNP+H9VClqQaNdbOrN2cr/xSawsUy56iWN1t26Pf4P9qVz6gv8kix9VtkER6Smv2eS8g7XcOYTaajfVy8WS0x6NNM36JY44kVeoaYXCIaAAulRI0L5SkwvsNTo7qmpMCLuwDbfC8wcWBfV0wq3vO0U1CrtJ0pNkmq2k4p6vF3AhPwHVBv5CczT47cOxjyLfgvpQLmwlkorZ2FSGh6W2feuMPveSeHy9MWJu5RdXgkGxG+d7aTg38RQRKFe1feWXFMn4SWyOcWaFQpZVohKOvNiYAIaG9fyRfjwbF9GysT4oFCBpSpxPA+WbKbm8kC9qaCBqraAsUB3e1eXy+SdYebPrNTw0D9yTeeYHX/1oYEnoOQy6QmcN99oGwVCRcFOT7uCNx+fl0dEVAS4AqUhjrPC64H6kP8mjkGgcI1MCNSMnUnC/NsOzkBtUVNaNWZGxuSeGi5oQh+vUAd6xlBXjDcK5lm3lFaHHGbSEMVfU5I0AImmZnCk4xQKqir9OINGL0QeT43vnUS5r6jnB8zvnsKjGPAlXecJd7vX4oUjiQBnIkExW+yclqNcMWfnsCrPSsLYwPD5Pbb/JEb+yIbiZNWiwak2pp8PAFjMOdBC6Eq8EFlEMo9krTNkHzeJEwmVWFas26yoFAIERUvqyJ7OhLQ3D1A3U0tGxgFKJZF5nqU/V7Op+YCgANnPGc/H48jbMEuMub6zORWyMp1RNFtbn1BO+hs+l0fYMoXpd3+7VgJjej+63H5zl+oCePR0NdbbIn0Cl3SP+7zFms/UfFS5DNfT9EKHU7PbnHOWPJ12mikV/vFYyvRyBFk5xOpFGmIg+I+GrHGtn+h9H2nOGILP5Y6XbQxbg9WqfYmbcSIrpDrPlWmx1x5h0QraDcu63yNaUhXJGwrNoQSdHun50EDd2s5xiUxuN5zxkHM+c7df2mAJFUe34EsC4lCScaNPb/k8A/IGtqSanT5kcLhNIwEtDxh4Qgd7vGRLIRT4WDHdOycsVlF7siVQ/rsGMv+ouHxxTO2tMPG4I48JMRB5xd45W6RgdjcfDcjnoEr+9ZVk6aTHwAFNnLKE2lkmUcI3CRaEgAAAQU5NRrYEAABfAABfAAB1AAB2AABCAAAAQUxQSFUAAAABDzD/ERHCcSJJjlRQbq3w36eCXK3u6h/R/wng5nzLUnAOrKEN4LTad+Hm3Mep4+wsBfBQBMDaB5jL4EZWWgXAUijDzSaOc+J0kQ4csIY2TiFuzr8FAFZQOCBABAAAdB8AnQEqdgB3AD5RII5EAwcnuYAAoJaQDTK3Lckb4ijYIPusRreBpLeSmasE5nh5xKvRa/S3HgGopKSzlQM1zfz+nPKBBH+pKpmAOuXpdCsvkdmL6xyJL0m+Aa+x6fxTlVJsJx1wjg9mcn3nhD/QYhQEgn78zV+bhQp1Nj1LO4+uth/TLK5Uti+efAsJzSZ5T/pcSzeCdQCVTk4/L9ttWv+H6I2cnOLRbq7fe7qlIhxatLcM6bVoFkfF0//8YHyEFN/XMoOBAuD+JaVrppRy6k2YnXcpFPVk3ExdO+VHCStw/AxZmTayeW4GhUPb1PaT5CqSZ6P4DCoOevSuGyYD/ue4YIAA/v2pCm1mM2xFzR81CidlmSGjH2X/1nhIyWvkZ1jrMpGPXiD6VWhTvNxLhxoDmD9T97FPVAGF+YvF4THBF69rk6yyzXRVQios0gZqlvAUB1rePznj/M65tmHd0s0UbpOWRj202XHiqP9YZozQHAKwxBDl7HXNHCYUDi0F9/Bw9NlgSXAC/aOKtL+LfDiWXz/l9gd1yAApyAAOwYjRQuGDll8fZVDAzwhnyeMQ2N50/475bn9LpC/lKHNwwvNABZtTbmCaaargBURkQsOeyBZZ8684p2wf7jXCR72wFaJIiYvN++Pyouymf+1FJqzcRkb6pZjNizS53RfbxfDXXLet7Ih6qveqJ0E80RoeougMEHZNspqYsUNx6f3OGhDJbuNhqYFJ1JLTLs8W7sAuzOPTYkZrD3O3ilgUD4R4qRAFqG0aDYLAPy4pIcPejc61a8HfIwiyxe8PTtbivd6gZBH6bPMOX18zS5rf3RMWd4t+TCU+20l6YGq3YtibguUAhufX+P3uHJCK5gf75KX1DLLttVCjVC76dyVzy/4IvYmHo7GZu+J1yom7RNhq6cClo/n7lyhUH0+gml400wSusLb/izT0iQDlLjBkcA3HET7j/3d0YQ7I5Ukkbk31uiHV9NAAI8n/LUyaxTwnV5dKUltwyaiq0p4/uyaSaHYFONN2VomJWhidjdgBsZJ/l+xC+inas6p9hqAAI7JIAMbTk4aTvMlqTlXb+S06j2rQhDMJVKoxQ44H9kb1JEdwFf5OpUt8LZvXNHABSSmXYFkPe+Z7mZh/z2eGqNn8SZ1Kq2orNBRDCe1G7ryoG6EmxPsB1jRd03viSvvT7/4XttaghnNxfYhDXwiCWyXBu6tjFhXvlkVI1Usla61l2RDpNTGsPvc8SCRPNq+xcO/CrsS2fTQuMQB72ZL13fQ6fdKvnoFHY2h8V1kl2aUzZ/jECDtJb9bLrUw4q3KazBrCV2yHLGAHYj7o/Ivu5VwdthNOgpO2ifPcp3czTi+1kysrpyfDu9/rjgC/Hfo/ajPennLWsq3MyAdZNKUEBZBMCFIA9Mky3KgB3D3dvEsvDHczoPAFD5FqLyOTONnQAAAAAAA=`;


export const ActiveRoomProvider = ({ children }) => {
  const roomContext = React.useContext(RoomContext);
  const Notifications = React.useContext(NotificationContext);

  const [messages, setMessages] = React.useState([]);
  const [controlMessages, setControlMessages] = React.useState([]);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [moreMessages, setMoreMessages] = React.useState(true);
  const [changeUsername, setChangeUsername] = React.useState({ _id: '', name: '' });
  const [roomOwner, setRoomOwner] = React.useState(false);
  const [roomAdmin, setRoomAdmin] = React.useState(false);
  const [isVerifiedGuest, setIsVerifiedGuest] = React.useState(false);
  const [locked, setLocked] = React.useState(false);
  const [adminError, setAdminError] = React.useState(false);
  const [motd, setMotd] = React.useState('');
  const [roomCapacity, setRoomCapacity] = React.useState(2);
  const [joinRequests, setJoinRequests] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [replyTo, setReplyTo] = React.useState(null);
  const [replyEncryptionKey, setReplyEncryptionKey] = React.useState({});
  const [username, setUsername] = React.useState({});
  const [files, setFiles] = React.useState([]);
  const [imgUrl, setImgUrl] = React.useState(null);
  const [sbImage, setSbImage] = React.useState(null);
  const [ownerRotation, setOwnerRotation] = React.useState(null);

  const setKeys = (newKeys) => {
    keys = Object.assign(keys, newKeys);
  }

  const getKeys = () => {
    return keys;
  }

  const changeRoomId = (newRoom) => {
    roomId = newRoom;
  }

  const loadRoom = async (data = null) => {
    console.time('load-room')
    if (!roomReady) {
      let _keys = data.keys;
      await loadRoomKeys(_keys);
      setMotd(data.motd);
      setLocked(data.roomLocked)
      setOwnerRotation(data.ownerRotation)
      if (data.motd !== '') {
        sendSystemInfo('Message of the Day: ' + data.motd);
      } else {
        sendSystemMessage('Connected');
      }
      roomReady = true;
    }
    console.timeEnd('load-room')
  }

  // ##############################  FUNCTIONS TO GET ALL RELEVANT KEYS FROM KV/DO  ###############################

  const loadPersonalKeys = async (loadRoom) => {
    try {
      let _exportable_pubKey = null;
      let _exportable_privateKey = null;
      let _privateKey = null;
      if (localStorage.getItem(loadRoom) == null) {
        const keyPair = await generateKeys();
        _exportable_pubKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        _exportable_privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        _privateKey = keyPair.privateKey;
        localStorage.setItem(loadRoom, JSON.stringify(_exportable_privateKey));
        setKeys({ exportable_pubKey: _exportable_pubKey, privateKey: _privateKey })
      } else {
        try {
          _exportable_privateKey = JSON.parse(localStorage.getItem(loadRoom));
          _exportable_pubKey = extractPubKey(_exportable_privateKey);
          _privateKey = await importKey("jwk", _exportable_privateKey, "ECDH", true, ["deriveKey"]);
          setKeys({ exportable_pubKey: _exportable_pubKey, privateKey: _privateKey })
        } catch {
          setError("The " + loadRoom + " key in the localstorage is corrupted. Please try importing it again. If you still find this error, you will need to delete the key for this room from the localStorage and the app will generate a new identity for you.")

        }
      }
    } catch (e) {
      console.error(e)
    }
  }


  const loadRoomKeys = async (_keys) => {
    try {
      console.log("Loading room keys...")
      if (_keys.ownerKey === null) {
        return { error: "Room does not exist" }
      }
      let _exportable_owner_pubKey = JSON.parse(_keys.ownerKey || JSON.stringify({}));
      if (_exportable_owner_pubKey.hasOwnProperty('key')) {
        _exportable_owner_pubKey = typeof _exportable_owner_pubKey.key === 'object' ? _exportable_owner_pubKey.key : JSON.parse(_exportable_owner_pubKey.key)
      }
      try {
        _exportable_owner_pubKey.key_ops = [];
      } catch (error) {
        console.error("Error in getKeys(): ")
        console.error(error);
      }
      const _exportable_room_signKey = JSON.parse(_keys.signKey);
      const _exportable_encryption_key = JSON.parse(_keys.encryptionKey);
      let _exportable_verifiedGuest_pubKey = JSON.parse(_keys.guestKey || null);
      const _exportable_pubKey = keys.exportable_pubKey;
      const _privateKey = keys.privateKey;
      let isVerifiedGuest = false;
      const _owner_pubKey = await importKey("jwk", _exportable_owner_pubKey, "ECDH", false, []);
      if (_owner_pubKey.error) {
        console.error(_owner_pubKey.error);
      }
      let isOwner = areKeysSame(_exportable_pubKey, _exportable_owner_pubKey);
      let isAdmin = (document.cookie.split('; ').find(row => row.startsWith('token_' + roomId)) !== undefined) || (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && isOwner);

      if (!isOwner && !isAdmin) {
        if (_exportable_verifiedGuest_pubKey === null) {
          fetch(config.ROOM_SERVER + roomId + "/postPubKey?type=guestKey", {
            method: "POST",
            body: JSON.stringify(_exportable_pubKey),
            headers: {
              "Content-Type": "application/json"
            }
          });
          _exportable_verifiedGuest_pubKey = { ..._exportable_pubKey };
        }
        if (areKeysSame(_exportable_verifiedGuest_pubKey, _exportable_pubKey)) {
          isVerifiedGuest = true;
        }
      }

      const _encryption_key = await importKey("jwk", _exportable_encryption_key, "AES", false, ["encrypt", "decrypt"]);

      const _room_privateSignKey = await importKey("jwk", _exportable_room_signKey, "ECDH", true, ['deriveKey']);
      const _exportable_room_signPubKey = extractPubKey(_exportable_room_signKey);
      const _room_signPubKey = await importKey("jwk", _exportable_room_signPubKey, "ECDH", true, []);
      const _personal_signKey = await deriveKey(_privateKey, _room_signPubKey, "HMAC", false, ["sign", "verify"])


      let _shared_key = null;
      if (!isOwner) {
        _shared_key = await deriveKey(_privateKey, _owner_pubKey, "AES", false, ["encrypt", "decrypt"]);
      }

      let _locked_key = null;
      let _exportable_locked_key = localStorage.getItem(roomId + '_lockedKey');
      if (_exportable_locked_key !== null) {
        _locked_key = await importKey("jwk", JSON.parse(_exportable_locked_key), "AES", false, ["encrypt", "decrypt"]);
      } else if (keys.locked_key) {
        const _string_locked_key = (await decrypt(isOwner ? await deriveKey(keys.privateKey, await importKey("jwk", keys.exportable_pubKey, "ECDH", true, []), "AES", false, ["decrypt"]) : _shared_key, JSON.parse(keys.locked_key), "string")).plaintext;
        _exportable_locked_key = JSON.parse(_string_locked_key);
        _locked_key = await importKey("jwk", JSON.parse(_exportable_locked_key), "AES", false, ["encrypt", "decrypt"]);
      }

      setKeys({
        ...keys,
        shared_key: _shared_key,
        exportable_owner_pubKey: _exportable_owner_pubKey,
        exportable_verifiedGuest_pubKey: _exportable_verifiedGuest_pubKey,
        personal_signKey: _personal_signKey,
        room_privateSignKey: _room_privateSignKey,
        encryptionKey: _encryption_key,
        locked_key: _locked_key,
        exportable_locked_key: _exportable_locked_key
      })
      setRoomOwner(isOwner)
      setRoomAdmin(isAdmin)
      setIsVerifiedGuest(isVerifiedGuest)
      if (currentWebSocket) {
        currentWebSocket.send(JSON.stringify({ ready: true }));

      } else {
        setTimeout(() => {
          console.log('Websocket was not opened, retrying')
          currentWebSocket.send(JSON.stringify({ ready: true }));
        }, 5000)
      }

      console.log('Room keys loaded!');
      if (isAdmin) {

        await getAdminData()
        roomContext.setShowAdminTab(true);
        console.log('AdminDialog features loaded!');
      }
    } catch (e) {
      console.error(e);
      setError('Failure loading room keys. Please try joining the room again...')
    }
  }


  // ############################   FUNCTIONS TO HANDLE MESSAGES  ############################################


  const sendSystemInfo = (msg_string) => {
    setMessages(
      [...messages, {
        _id: messages.length,
        text: msg_string,
        user: { _id: 'system', name: 'System Message' },
        whispered: false,
        verified: true,
        info: true
      }]
    );
  }


  const sendSystemMessage = (message) => {
    setMessages(
      [...messages, {
        _id: messages.length,
        text: message,
        system: true
      }]);
  }

  const unwrapMessages = async (new_messages) => {

    let unwrapped_messages = {}
    for (let id in new_messages) {
      if (new_messages[id].hasOwnProperty("encrypted_contents")) {
        try {
          const decryption_key = keys.encryptionKey
          let msg = await decrypt(decryption_key, new_messages[id].encrypted_contents)
          if (msg.error) {
            msg = await decrypt(keys.locked_key, new_messages[id].encrypted_contents)
          }
          // console.log(msg)
          const _json_msg = JSON.parse(msg.plaintext);
          if (!_json_msg.hasOwnProperty('control')) {
            unwrapped_messages[id] = _json_msg;
          } else {
            // console.log(_json_msg);
            setControlMessages([...controlMessages, _json_msg])
          }
        } catch (e) {
          // console.error(e);
          // Skip the message if decryption fails - its probably due to the user not having <roomId>_lockedKey.
        }
      } else {
        unwrapped_messages[id] = new_messages[id];
      }
      localStorage.setItem(roomId + "_lastSeenMessage", id.slice(roomId.length));
    }
    return unwrapped_messages;
  }


  const wrapMessage = async (contents) => {
    let enc_key;
    if (locked && keys.locked_key != null) {
      enc_key = keys.locked_key;
      // console.log(enc_key)
    } else if (contents.encrypted || !locked) {
      enc_key = keys.encryptionKey;
    }
    let msg;
    try {
      msg = { encrypted_contents: await encrypt(JSON.stringify(contents), enc_key, "string") }
    } catch {
      return { error: 'Could not send message. The encryption key seems to be corrupted.' }
    }
    return msg;

  }

  const getWhisperToText = () => {
    let contacts = roomContext.contacts;
    return contacts[JSON.parse(replyTo._id).x + ' ' + JSON.parse(replyTo._id).y]
  }


  const addChatMessage = async (new_messages, old_messages = false) => {
    let _messages = [];
    let _text_verified = true;
    let _image_verified = true;
    let _imageMetadata_verified = true;
    let contacts = roomContext.contacts;
    for (let id in new_messages) {
      try {
        if (new_messages[id].hasOwnProperty('contents')) {
          if (new_messages[id].encrypted === true) {
            let shared_key = keys.shared_key
            if (!areKeysSame(keys.exportable_pubKey, new_messages[id].sender_pubKey)) {
              shared_key = await deriveKey(
                keys.privateKey,
                await importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
            }
            if (new_messages[id].recipient && roomOwner) {
              shared_key = await deriveKey(keys.privateKey, await importKey("jwk", new_messages[id].recipient, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
            }
            let decrypted_message = await decrypt(shared_key, new_messages[id].contents)
            if (decrypted_message.error && roomOwner) {
              shared_key = await deriveKey(keys.room_privateKey, await importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
              decrypted_message = await decrypt(shared_key, new_messages[id].contents)
            }
            if (new_messages[id].image != null) {
              const decrypted_image = await decrypt(shared_key, new_messages[id].image, "arrayBuffer");
              new_messages[id].image = decrypted_image.error ? '' : await getFileData(new File([decrypted_image.plaintext], "img", { type: "image/jpeg" }), "url")
              const decrypted_imageMetadata = await decrypt(shared_key, new_messages[id].imageMetaData)
              new_messages[id].imageMetaData = decrypted_imageMetadata.error ? {} : JSON.parse(decrypted_imageMetadata.plaintext);
            }
            new_messages[id].contents = decrypted_message.plaintext
            if (decrypted_message.error) {
              new_messages[id].whispered = true;
            }
          } else {
            const sign = new_messages[id].sign;
            const _image_sign = new_messages[id].image_sign
            const _imageMetadata_sign = new_messages[id].imageMetadata_sign;
            if (!sign || !_image_sign || !_imageMetadata_sign) {
              _text_verified = false
            } else {
              const sender_pubKey = await importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []);
              const verificationKey = await deriveKey(keys.room_privateSignKey, sender_pubKey, "HMAC", false, ["sign", "verify"])
              _text_verified = await verify(verificationKey, sign, new_messages[id].contents)
              _image_verified = await verify(verificationKey, _image_sign, new_messages[id].image)
              _imageMetadata_verified = await verify(verificationKey, _imageMetadata_sign, typeof new_messages[id].imageMetaData === "object" ? JSON.stringify(new_messages[id].imageMetaData) : new_messages[id].imageMetaData)
            }
          }
          let user_key = new_messages[id].sender_pubKey.x + " " + new_messages[id].sender_pubKey.y;
          let username = "";
          let user_id = JSON.stringify(new_messages[id].sender_pubKey);
          const unnamed = ['Anonymous', 'No Name', 'Nameless', 'Incognito', 'Voldemort', 'Uomo Senza Nome', 'The Kid', 'Gunslinger', 'IT ', 'Person in Black', 'बेनाम', 'βλέμμυες', '混沌'];
          const local_username = contacts.hasOwnProperty(user_key) && contacts[user_key].split(' ')[0] !== 'User' && !unnamed.includes(contacts[user_key].trim()) ? contacts[user_key] : 'Unnamed';
          contacts[user_key] = local_username;
          const alias = new_messages[id].hasOwnProperty('sender_username') ? new_messages[id].sender_username : '';
          if (user_key === (keys.exportable_pubKey.x + " " + keys.exportable_pubKey.y) || local_username === 'Me') {
            contacts[user_key] = 'Me';
            username = 'Me';
            user_id = JSON.stringify(keys.exportable_pubKey);
          } else {
            if (alias !== '') {
              username = (local_username === alias || local_username === 'Unnamed') ? alias : alias + '  (' + local_username + ')';
            } else {
              username = '(' + local_username + ')';
            }
            if (areKeysSame(new_messages[id].sender_pubKey, keys.exportable_verifiedGuest_pubKey)) {
              username += "  (Verified)"
            } else if (areKeysSame(new_messages[id].sender_pubKey, keys.exportable_owner_pubKey)) {
              username += "  (Owner)"
            }
          }
          let new_message = {
            _id: id,
            text: new_messages[id].contents,
            user: { _id: user_id, name: username },
            whispered: new_messages[id].encrypted,
            createdAt: parseInt(id.slice(-42), 2),
            verified: _text_verified && _image_verified && _imageMetadata_verified,
            image: new_messages[id].image,
            imageMetaData: typeof new_messages[id].imageMetaData === "object" ? new_messages[id].imageMetaData : JSON.parse(new_messages[id].imageMetaData)
          };

          if (!messages.some((message) => new_message._id === message._id && new_message.id !== 'system')) {
            _messages.push(new_message);
          }
        }
      } catch (e) {
        console.error(e);
      }

    }
    roomContext.updateContacts(contacts);
    if (old_messages) {
      const moreMessages = _messages.length !== 0;
      if (!moreMessages) {
        _messages.push({ _id: "no_old_message", text: "No older messages", system: true })
      }
      setMessages(uniqBy([..._messages, ...messages], '_id'))
      setMoreMessages(moreMessages)
    } else {
      setMessages(uniqBy([...messages, ..._messages], '_id'))
    }
  }


  const getOldMessages = async () => {
    try {
      setLoadingMore(false)
      const currentMessagesLength = messages.length;
      const fetch_resp = await fetch(config.ROOM_SERVER + roomId + "/oldMessages?currentMessagesLength=" + currentMessagesLength)
      let old_messages = await unwrapMessages(await fetch_resp.json());
      // console.log(old_messages)
      addChatMessage(old_messages, true);
      setLoadingMore(false)
    } catch (e) {
      console.error(e)
      sendSystemInfo('Could not fetch older messages');
    }
  }

  async function cleanQueue(message_id) {
    const cachedQueue = await document.cacheDb.getItem(`${roomId}_msg_queue`);
    if (cachedQueue === null) {
      return;
    }
    const queue = remove(cachedQueue, function (n) {
      return n._id !== message_id;
    });
    await document.cacheDb.setItem(`${roomId}_msg_queue`, queue);
  }

  const queueMessage = async (message, whisper) => {
    let queue = [];
    const cachedQueue = await document.cacheDb.getItem(`${roomId}_msg_queue`);
    if (cachedQueue) {
      queue = cachedQueue
    }
    queue.push({ ...message[0], whisper, files })
    await document.cacheDb.setItem(`${roomId}_msg_queue`, uniqBy(queue, '_id'));
  }

  const processMessageQueue = async (queue) => {
    await document.cacheDb.setItem(`${roomId}_msg_queue`, []);
    for (let i in queue) {
      if (queue[i].files.length > 0) {
        console.log(queue[i].files)
        setFiles(queue[i].files)
      }
      if (queue[i]?._id) {
        sendMessage([{ ...queue[i] }], queue[i].whisper)
      }
    }
  }


  const sendMessage = async (message, whisper = false) => {
    let file; // psm: changing to SBImage() objects
    // let sbImage; // psm: should come from react

    console.log("Sending MESSAGE:");
    console.log(message);

    queueMessage(message, whisper);

    try {
      // If room has not been initalized, set system message
      if (error) {
        sendSystemInfo(error)
        setMoreMessages(false)
        return;
      }

      if (!whisper && keys.locked_key == null && locked) {

        sendSystemInfo('This room is restricted. A request to the Owner has already been sent. Until you are accepted you cannot chat in the room. You can still whisper the owner by pressing the user icon in the top right corner.')
        return;
      }
      let encrypted = (whisper && keys.shared_key != null) || replyTo;

      let contents = {}
      let msg = {}
      let shared_key = keys.shared_key;
      if (files !== null && files.length > 0) {
	console.log(`SBImage() with file:`);
	console.log(files[0]);
	// this generates the thumbnail (15 KB limit)
        // file = await getFileData(await restrictPhoto(files[0], 15, "image/jpeg", 0.92), encrypted ? 'arrayBuffer' : 'url');
	// sbImage = new SBImage(files[0]); // currently only images
	file = await getFileData(await restrictPhoto(sbImage, 15), encrypted ? 'arrayBuffer' : 'url');
	// sbImage.setFile(files[0], encrypted ? 'arrayBuffer' : 'url'); // psm: i'm a bit confused about whisper in this context
	if (encrypted == 'url') {
	  console.log("################################################################");
	  console.log("################################################################");
	  console.log("#### ok ... why is this ever value 'url'? ");
	  console.log("################################################################");
	  console.log("################################################################");
	}
      }

      let imgId = '', previewId = '', imgKey = '', previewKey = '', fullStorePromise = '', previewStorePromise = '';

      if (sbImage != null) {
        // let image_data = await saveImage(files[0], roomId, sendSystemMessage);
        let image_data = await saveImage(sbImage, roomId, sendSystemMessage);
        if (typeof image_data !== 'string') {
          imgId = image_data.full;
          imgKey = image_data.fullKey;
          previewId = image_data.preview;
          previewKey = image_data.previewKey;
          fullStorePromise = image_data.fullStorePromise;
          previewStorePromise = image_data.previewStorePromise;
        } else {
          await document.cacheDb.setItem(`${image_data}_msg`, message);
        }

      } else if (message[0].text === '') {
        cleanQueue(message[0]._id);
        return;
      }

      // If room owner wants to reply with an encrypted message to a particular user (or message sender), use a shared AES key between the user and that message sender
      if (replyTo) {
        shared_key = replyEncryptionKey;
        contents.recipient = JSON.parse(replyTo._id);
      }
      // Encrypt message with shared key between room owner and verified guest if the "Whisper" checkbox is selected or if the room owner wants to reply to a particular message with an encrypted message
      if (encrypted) {

        const _content = await encrypt(message[0].text, shared_key, "string");
        const encrypted_img = await encrypt(file, shared_key, "string");
        // const encrypted_imageMetadata = await encrypt(JSON.stringify({ imageId: imgId, imageKey: imgKey, previewId: previewId, previewKey: previewKey }), shared_key, "string");
        const encrypted_imageMetadata = await encrypt(JSON.stringify({
          imageId: imgId,
          previewId: previewId,
          imageKey: imgKey,
          previewKey: previewKey
        }), shared_key, "string");

        contents = {
          ...contents,
          encrypted: true,
          contents: _content,
          sender_pubKey: keys.exportable_pubKey,
          image: encrypted_img,
          imageMetaData: encrypted_imageMetadata
        };
      } else {
        const _sign = await sign(keys.personal_signKey, message[0].text);
        const _image_sign = await sign(keys.personal_signKey, file);
        const _imageMetadata = { imageId: imgId, previewId: previewId, imageKey: imgKey, previewKey: previewKey }
        const _imageMetadata_string = JSON.stringify(_imageMetadata);
        const _imageMetadata_sign = await sign(keys.personal_signKey, _imageMetadata_string)
        contents = {
          encrypted: false,
          contents: message[0].text,
          sender_pubKey: keys.exportable_pubKey,
          sign: _sign,
          image: file,
          image_sign: _image_sign,
          imageMetaData: _imageMetadata_string,
          imageMetadata_sign: _imageMetadata_sign
        };
      }
      contents.sender_username = username;
      msg = await wrapMessage(contents);
      if (msg.error) {
        sendSystemInfo(msg.error);
        return;
      }
      if (currentWebSocket) {
        currentWebSocket.send(JSON.stringify(msg));
        if (typeof fullStorePromise === 'object') {
          fullStorePromise.then(async (controlData) => {
            let control_msg = await wrapMessage({ ...controlData, control: true });
            setControlMessages([...controlMessages, control_msg].filter(onlyUnique))
            currentWebSocket.send(JSON.stringify(control_msg));
          });
        }
        if (typeof previewStorePromise === 'object') {
          previewStorePromise.then(async (controlData) => {
            let control_msg = await wrapMessage({ ...controlData, control: true });
            setControlMessages([...controlMessages, control_msg].filter(onlyUnique))
            currentWebSocket.send(JSON.stringify(control_msg));
          });
        }
        cleanQueue(message[0]._id);
      } else {
        console.log(msg)
        sendSystemMessage("Your client is offline. Your message will send once connectivity is restored.")
      }

    } catch (e) {
      console.error(e);
      sendSystemInfo('Could not send message');
      Notifications.setMessage('Sending message failed, error from server: ' + e.message);
      Notifications.setSeverity('error');
      Notifications.setOpen(true)
    }

    // Reset the 'reply_to' data once message is sent
    try {
      setReplyTo(null)
      setReplyEncryptionKey(null)
      removeInputFiles();
    } catch {
      // we ignore problems
    }
  }

  // ############################   Load the entire room from cache   ##########################################
  const loadFromCache = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const loadRoomData = await document.cacheDb.getItem(`${roomId}_data`)
        if (loadRoomData !== null) {
          await loadRoom(loadRoomData);
        }

        const messageData = await document.cacheDb.getItem(`${roomId}_messages`)

        const _messages = await unwrapMessages(messageData);
        await addChatMessage(_messages)
        console.log('Loaded from room from cache')
        resolve();
      } catch (e) {
        console.error(e)
        reject(e)
      }

    })

  }
  // ############################   FUNCTIONS TO HANDLE WEBSOCKET   ##########################################
  const join = async (selectedRoom) => {
    try {
      loadFromCache();
      let ws = new WebSocket(config.ROOM_SERVER_WS + selectedRoom + "/websocket");
      let rejoined = false;
      let startTime = Date.now();

      let rejoin = async () => {
        if (!rejoined) {
          rejoined = true;
          currentWebSocket = null;

          // Don't try to reconnect too rapidly.
          let timeSinceLastJoin = Date.now() - startTime;
          if (timeSinceLastJoin < 10000) {
            // Less than 10 seconds elapsed since last join. Pause a bit.
            await new Promise(resolve => setTimeout(resolve, 10000 - timeSinceLastJoin));
          }

          // OK, reconnect now!
          join(selectedRoom);
        }
      }

      ws.addEventListener("open", async (event) => {
        currentWebSocket = ws;
        // Send user info message.
        ws.send(JSON.stringify({ name: JSON.stringify(keys.exportable_pubKey) }));
        console.info('Websocket Opened')
        let messageQueue = await document.cacheDb.getItem(`${roomId}_msg_queue`)
        if (messageQueue !== null && messageQueue.length > 0) {
          processMessageQueue(messageQueue)
        }

      });

      ws.addEventListener("message", async event => {
        let data = JSON.parse(event.data);
        if (data.error) {
          sendSystemInfo("Error from server: " + data.error)
        } else if (data.ready) {
          await document.cacheDb.setItem(`${roomId}_data`, data)
          loadRoom(data);
        } else if (data.system) {
          if (data.keyRotation) {
            sendSystemInfo('The room owner has rotated their keys. Please reload the room to update your copy of the owner keys.')
          }
        } else {
          let cachedMessages = await document.cacheDb.getItem(`${roomId}_messages`)
          if (!cachedMessages) {
            cachedMessages = [];
          }
          if (Object.keys(data).length > 1) {
            document.cacheDb.setItem(`${roomId}_messages`, uniqBy([...[data], ...[cachedMessages]], '_id')[0])
          } else {
            /*
            const newCache = [];
            for(let x in cachedMessages){
              if(cachedMessages[x].)
            }

             */
            cachedMessages[Object.keys(data)[0]] = data[Object.keys(data)[0]]
            document.cacheDb.setItem(`${roomId}_messages`, uniqBy([...[cachedMessages]], '_id')[0])
          }
          const _messages = await unwrapMessages(data);
          await addChatMessage(_messages)
        }
      });

      ws.addEventListener("close", event => {
        console.info('Websocket closed', event)
        if (event.code === 4000) {
          // console.log('Room does not exist');
          sendSystemInfo(event.reason)
          setError(event.reason)
        } else {
          rejoin();
        }
      });
      ws.addEventListener("error", event => {
        console.log("WebSocket error, reconnecting:", event);
        rejoin();
      });
    } catch (e) {
      console.error(e);
      sendSystemInfo('Could not connect to websocket')
      return ({ error: 'Could not connect to the websocket' })
    }
  }
  // #######################   MISC HELPER FUNCTIONS   ###############################


  const getRoomCapacity = () => {
    fetch(config.ROOM_SERVER + roomId + "/getRoomCapacity", { credentials: 'include' })
      .then(resp => resp.json()
        .then(data => data.capacity ? setRoomCapacity(data.capacity) : setAdminError(true))
      );
  }


  const updateRoomCapacity = (roomCapacity) => {
    fetch(config.ROOM_SERVER + roomId + "/updateRoomCapacity?capacity=" + roomCapacity, { credentials: 'include' })
      .then(data => console.log('this worked!'));
  }


  const getAdminData = async () => {
    let request = { credentials: "include" };
    if (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && roomOwner) {
      let token_data = new Date().getTime().toString();
      let token_sign = await sign(keys.personal_signKey, token_data);
      request.headers = { authorization: token_data + "." + token_sign }
    }

    const capacity = await document.cacheDb.getItem(`${roomId}_capacity`)
    const join_requests = await document.cacheDb.getItem(`${roomId}_join_requests`)
    if (capacity && join_requests) {
      console.log('Loading cached room data')
      setRoomCapacity(capacity);
      setJoinRequests(join_requests)
    }


    fetch(config.ROOM_SERVER + roomId + "/getAdminData", request)
      .then(resp => resp.json().then(data => {
          if (data.error) {
            setAdminError(true)
          } else {
            document.cacheDb.setItem(`${roomId}_capacity`, data.capacity)
            document.cacheDb.setItem(`${roomId}_join_requests`, data.join_requests)
            setRoomCapacity(data.capacity);
            setJoinRequests(data.join_requests)
          }
        })
      )
  }

  const saveUsername = (newUsername) => {
    try {
      let user = changeUsername
      const user_pubKey = JSON.parse(user._id);
      let contacts = roomContext.contacts;
      let _messages = Object.assign(messages);
      _messages.forEach(message => {
        if (message.user._id === user._id) {
          message.user.name = message.user.name.replace('(' + contacts[user_pubKey.x + ' ' + user_pubKey.y] + ')', '(' + newUsername + ')');
        }
      });
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
      setChangeUsername({ _id: '', name: '' })
      setMessages(_messages)
      roomContext.updateContacts(contacts);
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const getUsername = () => {
    const username = localStorage.getItem(roomId + '_username');
    return username === null ? '' : username;
  }


  const acceptVisitor = async (pubKey) => {
    try {
      let updatedRequests = joinRequests;
      updatedRequests.splice(joinRequests.indexOf(pubKey), 1);
      // console.log(pubKey);
      const shared_key = await deriveKey(keys.privateKey, await importKey("jwk", JSON.parse(pubKey), "ECDH", false, []), "AES", false, ["encrypt", "decrypt"]);
      setJoinRequests(updatedRequests)
      const _encrypted_locked_key = await encrypt(JSON.stringify(keys.exportable_locked_key), shared_key, "string")
      fetch(config.ROOM_SERVER + roomId + "/acceptVisitor", {
        method: "POST",
        body: JSON.stringify({ pubKey: pubKey, lockedKey: JSON.stringify(_encrypted_locked_key) }),
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const lockRoom = async () => {
    try {
      if (keys.locked_key == null && roomAdmin) {
        const _locked_key = await window.crypto.subtle.generateKey({
          name: "AES-GCM",
          length: 256
        }, true, ["encrypt", "decrypt"]);
        const _exportable_locked_key = await window.crypto.subtle.exportKey("jwk", _locked_key);
        localStorage.setItem(roomId + '_lockedKey', JSON.stringify(_exportable_locked_key));
        const lock_success = (await (await fetch(config.ROOM_SERVER + roomId + "/lockRoom", { credentials: 'include' })).json()).locked;
        console.log(lock_success);
        if (lock_success) {
          await (await acceptVisitor(JSON.stringify(keys.exportable_pubKey))).json();
          setLocked(true)
          window.location.reload();  // Need a better way to reload
          // await getJoinRequests();
        }
      }
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const isRoomLocked = async () => {
    try {
      const locked_json = (await (await fetch(config.ROOM_SERVER + roomId + "/roomLocked", { credentials: 'include' })).json());
      return locked_json.locked;
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const getJoinRequests = async () => {
    try {
      const joinRequests = (await (await fetch(config.ROOM_SERVER + roomId + "/getJoinRequests", { credentials: 'include' })).json())
      // console.log(joinRequests)
      joinRequests.error ? setAdminError(true) : setJoinRequests(joinRequests.join_requests);
    } catch (e) {
      console.error(e);
    }
  }

  // TODO needs supporting function from component
  const setMOTD = (motd) => {
    try {
      if (roomOwner) {
        fetch(config.ROOM_SERVER + roomId + "/motd", {
          method: "POST",
          body: JSON.stringify({ motd: motd }),
          headers: {
            "Content-Type": "application/json"
          }
        });
        setMotd(motd)
      }
    } catch (e) {
      console.error(e);
    }
  }

  const chooseFile = (e) => {
    setFiles(e.target.files)
  }

  const removeInputFiles = () => {
    setFiles([])
  }

  const selectRoom = async (selectedRoom) => {
    try {

      setMessages([])
      await loadPersonalKeys(selectedRoom);
      join(selectedRoom);
      setUsername(getUsername())
      let rooms = roomContext.rooms;
      roomContext.goToRoom(selectedRoom)
      if (!rooms.hasOwnProperty(selectedRoom)) {
        rooms[selectedRoom] = { name: 'Room ' + (Object.keys(rooms).length + 1).toString() };
        //roomContext.updateRoomNames(rooms)
      }
    } catch (e) {
      console.error(e);
    }
  }

  // const previewImage = async (photo, file) => {
  //   try {
  //     if (photo) {
  //       const b64url = await new Promise((resolve) => {
  //         const reader = new FileReader();
  //         reader.onload = (e) => resolve(e.target.result);
  //         reader.readAsDataURL(photo);
  //       });
  //       setImgUrl(b64url)
  //       setFiles([file])
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  const previewImage = async (photo, file) => {
    try {
      if (photo) {

	const sbImage = new SBImage(photo);

	// this put spinner up instantly
	// TODO: how is this made smaller than 80% x 80% initially?
	setImgUrl(spinnerB64);

	// psm: update, no need to block on this, a promise works fine
	// const b64url = await sbImage.img.then((i) => i.src);
        // setImgUrl(b64url)

	sbImage.img.then((i) => {
	  setImgUrl(i.src);

	  // console.log("++++++++++++++++ sbImageCanvas: ", sbImageCanvas);
 	  // console.log("I'm in preview, should have the sb object:");
	  // console.log(sbImage);
	  // console.log("I'm in preview, here is b64url:");
	  // console.log(b64url);
	});

	queueMicrotask(() => {
	  const imageCanvas = document.getElementById("previewImage");
	  console.log("&&&&&&&&&&&&&&&& imageCanvas", imageCanvas);

	  // TODO: this can be kicked off immediately but I do not
	  // know how to get a canvas reference
	  const sbImageCanvas = document.getElementById("previewSBImage");
	  console.log("&&&&&&&&&&&&&&&& sbImageCanvas", sbImageCanvas);

	  sbImageCanvas.width = imageCanvas.width;
	  // TODO: problem - we don't know the true height!
	  // sbImageCanvas.height = imageCanvas.height;
	  sbImage.loadToCanvas(sbImageCanvas);

	});

        setFiles([file])
	setSbImage(sbImage)
      }
    } catch (e) {
      console.error(e);
    }
  }

  const joinRoom = (roomId) => {
    if (!(keys.exportable_pubKey || error) && localStorage.getItem(roomId) !== null) {
      try {
        selectRoom(roomId);
      } catch (e) {
        console.error(e);
        sendSystemInfo('Could not enter the room')
      }
    }
  }


  return <ActiveChatContext.Provider value={{
    messages, setMessages,
    controlMessages, setControlMessages,
    loadingMore, setLoadingMore,
    moreMessages, setMoreMessages,
    keys,
    roomId, changeRoomId,
    changeUsername, setChangeUsername,
    roomOwner, setRoomOwner,
    roomAdmin, setRoomAdmin,
    isVerifiedGuest, setIsVerifiedGuest,
    locked, setLocked,
    adminError, setAdminError,
    motd, setMotd,
    roomCapacity, setRoomCapacity,
    joinRequests, setJoinRequests,
    error, setError,
    replyTo, setReplyTo,
    replyEncryptionKey, setReplyEncryptionKey,
    username, setUsername,
    files, setFiles,
    imgUrl, setImgUrl,
    sbImage, setSbImage,				       
    sendMessage,
    getOldMessages,
    chooseFile,
    removeInputFiles,
    getWhisperToText,
    selectRoom,
    previewImage,
    joinRoom,
    getKeys,
    saveUsername,
    lockRoom,
    setMOTD,
    updateRoomCapacity,
    sendSystemMessage,
    join
  }}>{children} </ActiveChatContext.Provider>
};

export default ActiveChatContext;

