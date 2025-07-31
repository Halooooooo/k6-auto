const fs = require('fs');
const path = require('path');

// 递归遍历目录
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 注释掉 @nestjs/swagger 导入
  if (content.includes("from '@nestjs/swagger'")) {
    content = content.replace(
      /import\s*{[^}]*}\s*from\s*'@nestjs\/swagger';/g,
      match => '// ' + match
    );
    modified = true;
  }

  // 注释掉 @Api 装饰器
  const apiDecorators = [
    '@ApiTags',
    '@ApiOperation',
    '@ApiResponse',
    '@ApiBearerAuth',
    '@ApiProperty',
    '@ApiConsumes'
  ];

  apiDecorators.forEach(decorator => {
    const regex = new RegExp(`^\\s*${decorator.replace('@', '\\@')}\\([^)]*\\)\\s*$`, 'gm');
    if (content.match(regex)) {
      content = content.replace(regex, match => '  // ' + match.trim());
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('已处理:', filePath);
  }
}

// 开始处理
const srcDir = path.join(__dirname, 'src');
walkDir(srcDir, processFile);
console.log('Swagger装饰器注释完成!');