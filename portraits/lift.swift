// swift lift.swift <in> <out.png>: lifts the subject out of a photo (Vision's foreground instance mask, as Photos'
// "Copy Subject" does) and writes it as a PNG with a transparent background, at the photo's full size.
import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count == 3, let image = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else { print("usage: lift <in> <out.png>"); exit(1) }
let handler = VNImageRequestHandler(ciImage: image, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else { print("no subject found"); exit(1) }
print("instances:", result.allInstances.count)
let masked = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: masked)
try CIContext().writePNGRepresentation(of: out, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("wrote", args[2], Int(out.extent.width), "x", Int(out.extent.height))
