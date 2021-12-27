import { readdir, stat, mkdir, writeFile } from "fs/promises";
import { resolve, join, extname } from "path";
import child from "child_process";
import { exit } from "process";
import { promisify } from "util";
// 需要使用npm v15以上运行
const exec = promisify(child.exec)

const cwd = process.cwd();
const root = resolve(cwd, './xdot');

const findDots = async () => {
  try {
    const files = await readdir(root, {
      encoding: "utf8",
    });
    return files
        .filter((file) => extname(file) === ".dot");
  } catch (err) {
    console.error(err);
  }
};

const outputPic = async (dotfiles) => {
    const map = {}
    const linkPrev = `https://github.com/Meglody/mini-vue/blob/xdot/xdot/assets/`
    try{
        await mkdir(join(root, './assets'))
    }catch(e){}
    const promises = dotfiles.map(async filePath => {
        const outname = join(root, './assets', `./${filePath.replace('.dot', '')}.png`)
        const filepath = join(root, filePath)
        const linkPath = `${linkPrev}${filePath.replace('.dot', '')}.png`
        map[`${filePath.replace('.dot', '')}.png`] = linkPath
        // 需要dot环境
        try {
            const {stderr} = await exec(`dot -Tpng > ${outname} ${filepath}`)
            return stderr
        } catch (error) {
            console.log(error)
        }
    })
    const res = await Promise.all(promises)
    if(!res.join('')){
        return map
    }else{
        return null
    }
}

const createTemplate = (map) => {
    const head = `
## 自用学习归纳分支

- 本文件夹用于展示脑图，README根据模版自动生成
    `
    let loop = ``
    Object.keys(map).forEach(fileName => {
        const fileLink = map[fileName]
        loop += `

![${fileName}](${fileLink})
        `
    })
    return head + loop
}

const outputMD = async (data) => {
    const path = join(root, './README.md')
    try{
        const res = await writeFile(path, data, {
            encoding: 'utf8'
        })
        if(!res){
            return 'success'
        }
    }catch(e){
        console.log(e)
    }
}

let dotFiles = await findDots();
const map = await outputPic(dotFiles)
console.log('====================================');
console.log('- 图片创建完成');
console.log('====================================');
const mdContent = createTemplate(map)
const res = await outputMD(mdContent)
if(res){
    console.log('====================================');
    console.log('- MarkDown创建完成');
    console.log('====================================');
}
exit()
