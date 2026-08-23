// functions/api/upload.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 定义一个统一添加 CORS 头的函数
function corsResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",   // 允许所有域名（或可改为你的具体域名）
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...extraHeaders,
    },
  });
}

export async function onRequest(context) {
  // 处理 OPTIONS 预检请求（CORS 必须）
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(context.request.url);
  const fileName = url.searchParams.get("fileName");
  const folder = url.searchParams.get("folder");

  // 参数校验
  if (!fileName || !folder) {
    return corsResponse(
      JSON.stringify({ error: "缺少 fileName 或 folder 参数" }),
      400,
      { "Content-Type": "application/json" }
    );
  }

  // 文件夹白名单：允许顶层白名单，或白名单后紧跟一级 "/设备Id" 子目录（用于同设备重复 PUT = 覆盖旧文件）
  const folderRe = /^(shiwen-nxuan64|shiwen-eliminated)(\/[A-Za-z0-9_.-]+)?$/;
  if (!folderRe.test(folder)) {
    return corsResponse(
      JSON.stringify({ error: "不允许的文件夹名称" }),
      403,
      { "Content-Type": "application/json" }
    );
  }

  // 同设备同文件名直接覆盖：不再加 Date.now() 前缀，使 Key 在同设备同表保持稳定
  const uniqueKey = `${folder}/${fileName}`;

  const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${context.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: context.env.R2_ACCESS_KEY_ID,
      secretAccessKey: context.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: context.env.R2_BUCKET_NAME,
    Key: uniqueKey,
  });

  try {
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });
    return corsResponse(
      JSON.stringify({ signedUrl, fileKey: uniqueKey }),
      200,
      { "Content-Type": "application/json" }
    );
  } catch (error) {
    return corsResponse(
      JSON.stringify({ error: error.message }),
      500,
      { "Content-Type": "application/json" }
    );
  }
}