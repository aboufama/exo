// swift masks.swift <in.png> <prefix>: writes two alpha mattes for the image, at its size, grey in RGB:
// <prefix>-inst.png (Vision's foreground instance mask) and <prefix>-person.png (person segmentation, accurate).
import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
let image = CIImage(contentsOf: URL(fileURLWithPath: args[1]))!
let prefix = args[2], ctx = CIContext(), srgb = CGColorSpace(name: CGColorSpace.sRGB)!
func write(_ mask: CIImage, _ name: String) throws {
  // scale the matte to the image, and copy its one channel into R, G and B
  let sx = image.extent.width / mask.extent.width, sy = image.extent.height / mask.extent.height
  let scaled = mask.transformed(by: CGAffineTransform(scaleX: sx, y: sy)).cropped(to: image.extent)
  let grey = scaled.applyingFilter("CIColorMatrix", parameters: ["inputRVector": CIVector(x: 1, y: 0, z: 0, w: 0), "inputGVector": CIVector(x: 1, y: 0, z: 0, w: 0), "inputBVector": CIVector(x: 1, y: 0, z: 0, w: 0), "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1), "inputBiasVector": CIVector(x: 0, y: 0, z: 0, w: 1)]).cropped(to: image.extent)
  try ctx.writePNGRepresentation(of: grey, to: URL(fileURLWithPath: "\(prefix)-\(name).png"), format: .RGBA8, colorSpace: srgb)
  print(name, Int(mask.extent.width), "x", Int(mask.extent.height), "→", Int(image.extent.width), "x", Int(image.extent.height))
}
let handler = VNImageRequestHandler(ciImage: image, options: [:])
let inst = VNGenerateForegroundInstanceMaskRequest()
let person = VNGeneratePersonSegmentationRequest()
person.qualityLevel = .accurate
person.outputPixelFormat = kCVPixelFormatType_OneComponent8
try handler.perform([inst, person])
if let r = inst.results?.first { try write(CIImage(cvPixelBuffer: try r.generateScaledMaskForImage(forInstances: r.allInstances, from: handler)), "inst") }
if let r = person.results?.first { try write(CIImage(cvPixelBuffer: r.pixelBuffer), "person") }
